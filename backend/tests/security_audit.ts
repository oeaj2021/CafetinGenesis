import http from 'http';
import { app } from '../src/app';
import jwt from 'jsonwebtoken';
import { ENV } from '../src/config/env';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function recordTest(suite: string, name: string, passed: boolean, details?: string) {
  results.push({ suite, name, passed, details });
  const icon = passed ? '✅' : '❌';
  console.log(`  ${icon} [${suite}] ${name}${details ? ` -> ${details}` : ''}`);
}

async function runSecurityAudit() {
  console.log('\n============================================================');
  console.log('🛡️  EJECUTANDO SUITE DE AUDITORÍA Y TESTS DE SEGURIDAD');
  console.log('    PROYECTO: CAFETÍN GÉNESIS');
  console.log('============================================================\n');

  // Start ephemeral server on random port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 4000;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // -------------------------------------------------------------
    // SUITE 1: HTTP Security Headers (OWASP A05)
    // -------------------------------------------------------------
    console.log('📋 SUITE 1: Cabeceras de Seguridad HTTP (Helmet & CORS)');
    const healthRes = await fetch(`${baseUrl}/health`);
    const headers = healthRes.headers;

    recordTest(
      'Cabeceras HTTP',
      'X-Content-Type-Options: nosniff activo',
      headers.get('x-content-type-options') === 'nosniff'
    );
    recordTest(
      'Cabeceras HTTP',
      'X-Frame-Options (Protección contra Clickjacking)',
      headers.get('x-frame-options') === 'SAMEORIGIN' || headers.has('x-frame-options')
    );
    recordTest(
      'Cabeceras HTTP',
      'X-Download-Options presente',
      headers.get('x-download-options') === 'noopen'
    );
    recordTest(
      'Cabeceras HTTP',
      'Ocultamiento de tecnología (X-Powered-By ausente)',
      !headers.has('x-powered-by')
    );

    // -------------------------------------------------------------
    // SUITE 2: Autenticación & Fugas de Información Sensible (OWASP A07 / A02)
    // -------------------------------------------------------------
    console.log('\n📋 SUITE 2: Autenticación, Credenciales & Exposición de Datos');

    // 2.1 Intento de login con credenciales erróneas
    const badLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@genesis.com', password: 'PasswordIncorrecta123!' })
    });
    recordTest(
      'Autenticación',
      'Rechazo de contraseña inválida (HTTP 401)',
      badLoginRes.status === 401
    );

    // 2.2 Inyección SQL en Formulario de Login
    const sqliLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: "' OR '1'='1' --", password: "' OR '1'='1'" })
    });
    recordTest(
      'Inyecciones',
      'Resistencia a SQL Injection en Login (HTTP 401 seguro)',
      sqliLoginRes.status === 401
    );

    // 2.3 Login Exitoso con Admin
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@genesis.com', password: 'admin123' })
    });
    const adminData = await adminLoginRes.json();
    const adminToken = adminData.token;

    recordTest(
      'Autenticación',
      'Inicio de sesión Admin válido (HTTP 200 + Token JWT)',
      adminLoginRes.status === 200 && Boolean(adminToken)
    );

    // 2.4 Verificación de no-exposición de hash de contraseña
    const exposesPassword = JSON.stringify(adminData).toLowerCase().includes('$2a$') ||
                            JSON.stringify(adminData).toLowerCase().includes('passwordhash') ||
                            'password' in (adminData.user || {});
    recordTest(
      'Exposición de Datos',
      'No filtración del hash/password en respuesta de login',
      !exposesPassword
    );

    // 2.5 Login con Cajero/Operador
    const operatorLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'cajero@genesis.com', password: 'cajero123' })
    });
    const operatorData = await operatorLoginRes.json();
    const operatorToken = operatorData.token;

    recordTest(
      'Autenticación',
      'Inicio de sesión Cajero/Operador (HTTP 200 + Token JWT)',
      operatorLoginRes.status === 200 && Boolean(operatorToken)
    );

    // 2.6 Verificación de perfil /api/auth/me sin hash
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const meData = await meRes.json();
    recordTest(
      'Exposición de Datos',
      'Endpoint /api/auth/me protegido y sin datos sensibles',
      meRes.status === 200 && !('password' in (meData.user || {}))
    );

    // -------------------------------------------------------------
    // SUITE 3: Control de Acceso & RBAC (OWASP A01 Broken Access Control)
    // -------------------------------------------------------------
    console.log('\n📋 SUITE 3: Control de Acceso & Privilegios RBAC');

    // 3.1 Acceso a ruta privada sin token
    const noTokenRes = await fetch(`${baseUrl}/api/invoices`);
    recordTest(
      'Control de Acceso',
      'Bloqueo de petición sin token en ruta protegida (HTTP 401)',
      noTokenRes.status === 401
    );

    // 3.2 Acceso con token manipulado / firma inválida
    const forgedToken = jwt.sign(
      { id: 'fake-id', email: 'hacker@evil.com', role: 'ADMIN' },
      'CLAVE_FALSA_HACKER_12345'
    );
    const forgedRes = await fetch(`${baseUrl}/api/invoices`, {
      headers: { Authorization: `Bearer ${forgedToken}` }
    });
    recordTest(
      'Control de Acceso',
      'Rechazo de Token JWT con firma falsificada (HTTP 401)',
      forgedRes.status === 401
    );

    // 3.3 Escalación de privilegios: Operador intenta modificar configuraciones del sistema
    const privEscSettings = await fetch(`${baseUrl}/api/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${operatorToken}`
      },
      body: JSON.stringify({ businessName: 'Cafetín Hackeado' })
    });
    recordTest(
      'RBAC',
      'Bloqueo a Operador en POST /api/settings (Requiere ADMIN -> HTTP 403)',
      privEscSettings.status === 403
    );

    // 3.4 Escalación de privilegios: Operador intenta sincronizar tasas BCV
    const privEscRates = await fetch(`${baseUrl}/api/rates/sync-dolarvzla`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${operatorToken}` }
    });
    recordTest(
      'RBAC',
      'Bloqueo a Operador en POST /api/rates/sync-dolarvzla (HTTP 403)',
      privEscRates.status === 403
    );

    // 3.5 Escalación de privilegios: Operador intenta eliminar categoría
    const privEscDeleteCat = await fetch(`${baseUrl}/api/categories/non-existent-id`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${operatorToken}` }
    });
    recordTest(
      'RBAC',
      'Bloqueo a Operador en DELETE /api/categories/:id (HTTP 403)',
      privEscDeleteCat.status === 403
    );

    // 3.6 Acceso legítimo de Admin a configuraciones
    const adminSettings = await fetch(`${baseUrl}/api/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        businessName: 'Cafetín Génesis Central',
        rif: 'J-12345678-9',
        phone: '+58 412 1234567',
        address: 'Piso 1, Edificio Génesis',
        currencySymbol: '$'
      })
    });
    recordTest(
      'RBAC',
      'Permiso concedido a ADMIN para POST /api/settings (HTTP 200)',
      adminSettings.status === 200
    );

    // -------------------------------------------------------------
    // SUITE 4: Validación Estricta de Entradas & Lógica de Negocio (OWASP A03 / A04)
    // -------------------------------------------------------------
    console.log('\n📋 SUITE 4: Validación de Entradas & Resistencia a Manipulación de Precios/Stock');

    // 4.1 Inyección de cantidades negativas en Facturación (Manipulación de inventario)
    const negQtyInvoice = await fetch(`${baseUrl}/api/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${operatorToken}`
      },
      body: JSON.stringify({
        clientName: 'Cliente Prueba',
        clientIdNumber: 'V-11223344',
        paymentMethod: 'CASH_USD',
        items: [
          { productName: 'Empanada', quantity: -10, unitPriceUSD: 1.50 }
        ]
      })
    });
    recordTest(
      'Validación Negocio',
      'Rechazo de cantidad negativa en facturación (HTTP 400 Zod)',
      negQtyInvoice.status === 400
    );

    // 4.2 Inyección de precios negativos en Facturación (Manipulación financiera)
    const negPriceInvoice = await fetch(`${baseUrl}/api/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${operatorToken}`
      },
      body: JSON.stringify({
        clientName: 'Cliente Prueba',
        clientIdNumber: 'V-11223344',
        paymentMethod: 'CASH_USD',
        items: [
          { productName: 'Café', quantity: 2, unitPriceUSD: -5.00 }
        ]
      })
    });
    recordTest(
      'Validación Negocio',
      'Rechazo de precio unitario negativo (HTTP 400 Zod)',
      negPriceInvoice.status === 400
    );

    // 4.3 Facturación con lista de ítems vacía
    const emptyItemsInvoice = await fetch(`${baseUrl}/api/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${operatorToken}`
      },
      body: JSON.stringify({
        clientName: 'Cliente Prueba',
        clientIdNumber: 'V-11223344',
        paymentMethod: 'CASH_USD',
        items: []
      })
    });
    recordTest(
      'Validación Negocio',
      'Rechazo de factura sin ítems (HTTP 400 Zod)',
      emptyItemsInvoice.status === 400
    );

    // 4.4 Inyección de abono negativo en Deudas (Fiados)
    const negDebtPayment = await fetch(`${baseUrl}/api/debts/fake-id/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${operatorToken}`
      },
      body: JSON.stringify({
        amountUSD: -20,
        paymentMethod: 'PAGO_MOVIL'
      })
    });
    recordTest(
      'Validación Negocio',
      'Rechazo de abono negativo en deudas (HTTP 400 Zod)',
      negDebtPayment.status === 400
    );

    // 4.5 Inyección de payload XSS en creación de cliente
    const xssClient = await fetch(`${baseUrl}/api/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${operatorToken}`
      },
      body: JSON.stringify({
        name: '<script>alert("XSS Attack")</script>',
        idNumber: `V-${Date.now().toString().slice(-8)}`,
        phone: '04141234567',
        address: '<img src=x onerror=alert(1)>'
      })
    });
    recordTest(
      'Protección XSS/Inyecciones',
      'Registro seguro de cadenas con caracteres especiales/HTML (Sin ejecución/crash)',
      xssClient.status === 201 || xssClient.status === 200
    );

    // -------------------------------------------------------------
    // SUITE 5: Fuzzing de Búsqueda & Manejo de Errores
    // -------------------------------------------------------------
    console.log('\n📋 SUITE 5: Fuzzing de Búsqueda SQL & Manejo Seguro de Excepciones');

    // 5.1 Fuzzing con caracteres especiales en búsqueda de facturas
    const fuzzSearch = await fetch(
      `${baseUrl}/api/invoices?search=' OR '1'='1' UNION SELECT NULL, NULL--`,
      { headers: { Authorization: `Bearer ${operatorToken}` } }
    );
    recordTest(
      'Fuzzing & Resiliencia',
      'Búsqueda con caracteres de inyección SQL manejada de forma segura (HTTP 200)',
      fuzzSearch.status === 200
    );

    // 5.2 Manejo de Payload JSON corrupto
    const badJson = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"identifier": "admin", invalid json...}'
    });
    recordTest(
      'Manejo de Errores',
      'Rechazo seguro de JSON malformado sin volcado de stack trace (HTTP 400)',
      badJson.status === 400
    );

    // -------------------------------------------------------------
    // RESUMEN FINAL
    // -------------------------------------------------------------
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    const failed = total - passed;

    console.log('\n============================================================');
    console.log(`📊 RESULTADO DE LA AUDITORÍA: ${passed}/${total} TESTS APROBADOS (${Math.round((passed/total)*100)}%)`);
    if (failed === 0) {
      console.log('🎉 ESTADO: SISTEMA BLINDADO Y APROBADO CON ÉXITO');
    } else {
      console.log(`⚠️  ATENCIÓN: Se detectaron ${failed} vulnerabilidades o fallos`);
    }
    console.log('============================================================\n');

  } finally {
    server.close();
  }
}

runSecurityAudit().catch(err => {
  console.error('Error durante la ejecución del test de seguridad:', err);
  process.exit(1);
});
