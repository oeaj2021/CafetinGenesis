# ☕ Cafetín Génesis - Sistema de Gestión Modular & Tienda Virtual

Sistema de gestión comercial y catálogo virtual estilo e-commerce para negocios, cafeterías y cafetines, optimizado para operaciones en Venezuela con cálculo automático de precios en **USD ($)** y **Bolívares (VES)** según la tasa oficial (BCV o Paralela), facturación/comprobantes de venta, control de inventario, compras a proveedores, cuentas por cobrar (fiados) y pedidos 1-clic a WhatsApp.

---

## ⚡ Inicio Rápido en Windows (1 Doble Clic)

Simplemente ejecuta el archivo:
👉 **`start.bat`** *(Doble clic en la raíz del proyecto)*

El script se encargará de:
1. Validar e inicializar la base de datos local SQLite con los datos iniciales.
2. Iniciar el **Backend** en `http://localhost:4000`.
3. Iniciar el **Frontend** en `http://localhost:5173`.
4. Abrir automáticamente la **Tienda Virtual** en tu navegador.

---

## 🚀 Arquitectura & Stack Tecnológico

- **Backend**: Node.js (v20+), Express, TypeScript, Prisma ORM, JWT, Bcrypt, Zod.
- **Frontend**: React 18, Vite (Puerto **5173**), TypeScript, Tailwind CSS, Lucide Icons, Zustand, Axios.
- **Base de Datos**: 
  - **Local**: SQLite (`backend/prisma/dev.db`) para pruebas inmediatas sin instalar nada.
  - **Producción**: PostgreSQL 16 para Dokploy.
- **CI/CD**: GitHub Actions con auto-despliegue mediante Webhook en Dokploy.

---

## 📦 Módulos del Sistema

1. **Catálogo Público / Tienda Virtual** (`http://localhost:5173`):
   - Precios duales en **\$** y **Bs** convertidos al vuelo con la tasa activa del día.
   - Carrito de compras con botón directo de envío de pedido a **WhatsApp**.
2. **Punto de Venta (POS) & Facturación**:
   - Emisión de facturas y tickets con correlativo automático (`FAC-00001`).
   - Múltiples métodos de pago (Efectivo \$, Efectivo Bs, Pago Móvil, Punto de Venta, Zelle, Crédito).
   - Formato listo para impresión térmica (80mm) y hoja estándar / PDF.
3. **Cuentas por Cobrar & Deudores (Fiados)**:
   - Registro automático al facturar a crédito.
   - Registro de abonos parciales y totales en \$ y Bs.
4. **Compras & Proveedores**:
   - Registro de compras de mercancía e incremento automático de stock.
5. **Dashboard Estadístico & Financiero**:
   - Filtro interactivo por **Día**, **Mes** y **Año**.
   - Ventas, Compras y **Margen Neto de Ganancia**.
6. **Tasas de Cambio**:
   - Registro de tasas (BCV Oficial, Paralelo) con activación en caliente.
7. **Directorio de Clientes**:
   - Registro de clientes con Cédula/RIF y seguimiento de deuda.
8. **Configuración de la Empresa**:
   - RIF, número de WhatsApp para pedidos y notas.

---

## 🔑 Credenciales de Acceso al Panel Administrativo
- **URL:** `http://localhost:5173/admin/login`
- **Usuario:** `admin@genesis.com`
- **Contraseña:** `admin123`

---

## 🚢 Despliegue en Dokploy & GitHub Actions

Para desplegar en Dokploy y activar la actualización automática en cada commit, consulta la guía detallada:
👉 [DOKPLOY_GUIDE.md](file:///c:/Users/Enigma/Documents/PROYECTOS/CafetinGenesis/DOKPLOY_GUIDE.md)
