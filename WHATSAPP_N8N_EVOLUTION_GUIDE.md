# 📲 Guía de Integración: Notificaciones y Envío de Facturas/Estados de Cuenta en PDF e IMAGEN (PNG) por WhatsApp (n8n + Evolution API)

Esta guía explica cómo enviar de forma 100% automatizada el **Estado de Cuenta** (con deuda activa) o el **Comprobante de Finiquito / Paz y Salvo** (cuando el cliente termina de cancelar a $0.00) directo a su WhatsApp personal, tanto en formato **PDF** como en formato **IMAGEN (PNG)** para visualización inmediata en el chat sin necesidad de visor externo.

---

## 🏗️ 1. Arquitectura del Flujo

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Cafetín Génesis Backend                         │
│  • GET /api/debts (Listado con saldos y teléfonos)                     │
│  • GET /api/debts/:id/pdf (Genera PDF Vectorial de Alta Definición)    │
│  • GET /api/debts/:id/image (Genera Imagen PNG en Alta Resolución)     │
│  • Formato Base64: ?format=base64 (JSON listo para n8n/Evolution API)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                              n8n Flow                                  │
│  1. Cron Programado (Recordatorio de Deudas)                           │
│  2. Webhook Inmediato al Registrar Abono Total (Finiquito $0.00)       │
│  3. Descarga el PDF o la Imagen (PNG) en Base64                        │
│  4. Envía a Evolution API con plantilla personalizada                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                             Evolution API                              │
│  • POST /message/sendMedia (Envío de Imagen PNG o Documento PDF)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        WhatsApp del Cliente                            │
│  🖼️ La Imagen (PNG) se previsualiza directamente en el chat            │
│  📄 El archivo PDF queda como respaldo oficial descargable             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 2. ¿Cuándo usar Imagen (PNG) vs PDF?

| Formato | Ventaja Principal | Ideal para | Endpoint Backend |
| :--- | :--- | :--- | :--- |
| **🖼️ IMAGEN (PNG)** | Se muestra **directamente en el chat de WhatsApp** sin que el cliente tenga que descargar ni abrir una app adicional. | Recordatorios rápidos de cobro, capturas de abono por chat y lectura inmediata en móvil. | `GET /api/debts/:id/image?format=base64` |
| **📄 DOCUMENTO (PDF)** | Documento formal vectorial con sello de solvencia y firmas para archivo contable. | Finiquitos finales, comprobantes de pago oficial y constancias de no poseer deuda. | `GET /api/debts/:id/pdf?format=base64` |

---

## 📡 3. Endpoints del Backend

### A. Para Imagen PNG (Directa o Base64):
* **Descarga/Ver Imagen:** `GET /api/debts/:id/image` (`Content-Type: image/png`)
* **Obtención JSON Base64 para n8n:** `GET /api/debts/:id/image?format=base64`

### B. Para Documento PDF (Directo o Base64):
* **Descarga/Ver PDF:** `GET /api/debts/:id/pdf` (`Content-Type: application/pdf`)
* **Obtención JSON Base64 para n8n:** `GET /api/debts/:id/pdf?format=base64`

---

## 💬 4. Ejemplos de Envío a Evolution API (`/message/sendMedia`)

### Opción 1: Enviar como IMAGEN (PNG) - Previsualización directa en el chat
```http
POST https://evolution.tudominio.com/message/sendMedia/cafetin_genesis
apikey: GenesisApiSecretKey_2026_Secure
Content-Type: application/json

{
  "number": "584141234567",
  "mediatype": "image",
  "mimetype": "image/png",
  "fileName": "Estado_Cuenta_Carlos_Mendoza.png",
  "media": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAyAAAA...",
  "caption": "Estimado(a) *Carlos Mendoza*, le compartimos su *Estado de Cuenta* de *Cafetín Génesis* ☕ sandwich.\n\n💵 *Saldo Pendiente:* $15.50\n🇻🇪 *Total en Bolívares:* Bs. 5,425.00 (Tasa BCV del día)\n\n💳 *Datos Pago Móvil:*\n• Banesco (0134) | RIF: J-50123456-7 | Telf: 0414-9998877\n\n_Por favor envíenos el comprobante al realizar su transferencia. ¡Muchas gracias!_"
}
```

### Opción 2: Enviar Finiquito de Solvencia (Totalmente Pagada $0.00)
```http
POST https://evolution.tudominio.com/message/sendMedia/cafetin_genesis
apikey: GenesisApiSecretKey_2026_Secure
Content-Type: application/json

{
  "number": "584141234567",
  "mediatype": "image",
  "mimetype": "image/png",
  "fileName": "Finiquito_Solvencia_Carlos_Mendoza.png",
  "media": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAyAAAA...",
  "caption": "🎉 ¡Buenas noticias, estimado(a) *Carlos Mendoza*! \n\nLe confirmamos que su cuenta en *Cafetín Génesis* ha sido *TOTALMENTE CANCELADA* (Saldo: $0.00). \n\nAdjuntamos su *Comprobante de Finiquito y Paz y Salvo* como constancia de solvencia. \n\n☕🥪 ¡Muchísimas gracias por su preferencia!"
}
```

---

## 🔄 5. Flujo en n8n con Selección de Imagen o PDF (JSON Importable)

Copia este JSON e impórtalo en **n8n** (**Workflows > Import from Clipboard**):

```json
{
  "name": "Cafetin Genesis - Envio de Estado de Cuenta e Imagen por WhatsApp",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "expression": "0 9 * * 1,4"
            }
          ]
        }
      },
      "id": "trigger-cron",
      "name": "Cron Lun y Jue 9 AM",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [200, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "http://cafetin-backend:4000/api/auth/login",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            { "name": "identifier", "value": "admin" },
            { "name": "password", "value": "admin123" }
          ]
        },
        "options": {}
      },
      "id": "node-login",
      "name": "Autenticación API",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [400, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "http://cafetin-backend:4000/api/debts",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $json.token }}"
            }
          ]
        },
        "options": {}
      },
      "id": "node-get-debts",
      "name": "Consultar Deudas",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [600, 300]
    },
    {
      "parameters": {
        "fieldToSplitOut": "debts",
        "options": {}
      },
      "id": "node-split",
      "name": "Separar Clientes",
      "type": "n8n-nodes-base.itemLists",
      "typeVersion": 3.1,
      "position": [800, 300]
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict"
          },
          "conditions": [
            {
              "id": "cond-phone",
              "leftValue": "={{ $json.client?.phone || '' }}",
              "rightValue": "",
              "operator": { "type": "string", "operation": "notEmpty" }
            }
          ]
        }
      },
      "id": "node-check-phone",
      "name": "¿Tiene Teléfono Registrado?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [1000, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "=http://cafetin-backend:4000/api/debts/{{ $json.id }}/image?format=base64",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "={{ $('Autenticación API').item.json.token ? 'Bearer ' + $('Autenticación API').item.json.token : '' }}"
            }
          ]
        },
        "options": {}
      },
      "id": "node-get-image-base64",
      "name": "Generar Imagen Base64",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1220, 240]
    },
    {
      "parameters": {
        "jsCode": "const item = $input.item.json;\nlet rawPhone = String(item.clientPhone || '').replace(/\\D/g, '');\nif (rawPhone.startsWith('0')) {\n  rawPhone = '58' + rawPhone.slice(1);\n} else if (!rawPhone.startsWith('58')) {\n  rawPhone = '58' + rawPhone;\n}\n\nlet caption = '';\nif (item.isPaid) {\n  caption = `🎉 ¡Buenas noticias, estimado(a) *${item.clientName}*!\\n\\nLe confirmamos que su cuenta en *Cafetín Génesis* ha sido *TOTALMENTE CANCELADA* (Saldo: $0.00).\\n\\nAdjuntamos su *Comprobante de Finiquito y Paz y Salvo*. ¡Muchas gracias por su preferencia! ☕🥪`;\n} else {\n  caption = `Estimado(a) *${item.clientName}*, le compartimos su *Estado de Cuenta* de *Cafetín Génesis* ☕🥪\\n\\n💵 *Saldo en Divisas:* $${Number(item.remainingUSD).toFixed(2)}\\n🇻🇪 *Total en Bolívares:* Bs. ${Number(item.remainingVES).toFixed(2)}\\n\\n💳 *Datos Pago Móvil:*\\n• Banesco (0134) | RIF: J-50123456-7 | Telf: 0414-9998877\\n\\n_Por favor envíenos el comprobante al realizar su transferencia. ¡Muchas gracias!_`;\n}\n\nreturn {\n  json: {\n    number: rawPhone,\n    mediatype: 'image',\n    mimetype: 'image/png',\n    fileName: item.filename,\n    media: 'data:image/png;base64,' + item.base64,\n    caption: caption\n  }\n};"
      },
      "id": "node-build-payload",
      "name": "Formatear Mensaje e Imagen",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1440, 240]
    },
    {
      "parameters": {
        "amount": 5,
        "unit": "seconds"
      },
      "id": "node-wait-rate-limit",
      "name": "Pausa 5s (Anti-Ban)",
      "type": "n8n-nodes-base.wait",
      "typeVersion": 1.1,
      "position": [1660, 240]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://evolution.tudominio.com/message/sendMedia/cafetin_genesis",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "apikey",
              "value": "GenesisApiSecretKey_2026_Secure"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"number\": \"{{ $json.number }}\",\n  \"mediatype\": \"image\",\n  \"mimetype\": \"image/png\",\n  \"fileName\": \"{{ $json.fileName }}\",\n  \"media\": \"{{ $json.media }}\",\n  \"caption\": \"{{ $json.caption }}\"\n}",
        "options": {}
      },
      "id": "node-send-whatsapp",
      "name": "Enviar Imagen por WhatsApp",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1880, 240]
    }
  ],
  "connections": {
    "Cron Lun y Jue 9 AM": {
      "main": [[{ "node": "Autenticación API", "type": "main", "index": 0 }]]
    },
    "Autenticación API": {
      "main": [[{ "node": "Consultar Deudas", "type": "main", "index": 0 }]]
    },
    "Consultar Deudas": {
      "main": [[{ "node": "Separar Clientes", "type": "main", "index": 0 }]]
    },
    "Separar Clientes": {
      "main": [[{ "node": "¿Tiene Teléfono Registrado?", "type": "main", "index": 0 }]]
    },
    "¿Tiene Teléfono Registrado?": {
      "main": [[{ "node": "Generar Imagen Base64", "type": "main", "index": 0 }]]
    },
    "Generar Imagen Base64": {
      "main": [[{ "node": "Formatear Mensaje e Imagen", "type": "main", "index": 0 }]]
    },
    "Formatear Mensaje e Imagen": {
      "main": [[{ "node": "Pausa 5s (Anti-Ban)", "type": "main", "index": 0 }]]
    },
    "Pausa 5s (Anti-Ban)": {
      "main": [[{ "node": "Enviar Imagen por WhatsApp", "type": "main", "index": 0 }]]
    }
  }
}
```

---

## 💡 6. Verificación en el Panel Administrativo

Desde la sección **Cuentas por Cobrar & Deudores** (`/admin/deudas`):
1. Cada fila de cliente dispone de los botones **`PDF`** e **`IMG`**.
2. Al hacer clic en **`IMG`**, se descarga la imagen PNG de alta definición generada al instante por el servidor.
3. En el modal de **Historial**, se cuenta con los botones directos para descargar tanto en **Imagen (PNG)** como en **PDF**.
