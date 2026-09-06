# 🚀 Guía Maestra: Despliegue en VPS con Dokploy & CI/CD Automático al hacer Git Push

Esta guía explica paso a paso cómo conectar este proyecto a tu servidor VPS con **Dokploy** para que **cada vez que hagas un `git push` a tu repositorio de GitHub, tu servidor VPS se actualice y redespliegue automáticamente** sin necesidad de entrar al servidor.

---

## 🏗️ ¿Cómo funciona el Auto-Deploy en Dokploy?

Tienes **dos métodos disponibles** para la actualización automática:

```mermaid
flowchart TD
    A[💻 Desarrollador hace git push origin main] --> B[GitHub Repository]
    
    subgraph Opcion 1: CI/CD con GitHub Actions (Recomendado)
        B --> C[GitHub Actions Workflow]
        C --> D[🔍 Validación TypeScript & Build]
        D --> E[🛡️ 23 Tests de Seguridad Automatizados]
        E --> F[🚀 Disparo de Webhook Secreto a Dokploy]
    end

    subgraph Opcion 2: Webhook Directo de GitHub
        B -->|Payload Push Event| G[Dokploy Deploy Webhook]
    end

    F --> H[🖥️ VPS Dokploy]
    G --> H
    H --> I[🐳 Docker Compose Build & Pull]
    I --> J[🗄️ Auto-Sync de Base de Datos PostgreSQL]
    J --> K[🌱 Bootstrap de Usuarios y Tasa BCV si está vacía]
    K --> L[✨ Aplicación Actualizada en Vivo con Cero Caída]
```

---

## 🛠️ Paso 1: Configurar el Repositorio en GitHub

1. Inicializa y sube tu proyecto a tu cuenta de GitHub (si aún no lo has subido):
   ```bash
   git add .
   git commit -m "feat: complete pos with dokploy auto-deploy"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/CafetinGenesis.git
   git push -u origin main
   ```

---

## 🐳 Paso 2: Crear y Desplegar el Servicio en Dokploy

1. Inicia sesión en tu panel web de **Dokploy** en tu VPS (ej: `https://dokploy.tu-servidor.com`).
2. Ve al menú **Projects** y haz clic en **Create Project** (ejemplo: `Cafetín Génesis`).
3. Dentro del proyecto, haz clic en **Create Service** y selecciona **Compose**.
4. En la pestaña **General** / **Source**:
   - **Provider:** `GitHub` (puedes conectar tu cuenta de GitHub o usar Git URL si es público).
   - **Repository:** `TU_USUARIO/CafetinGenesis`
   - **Branch:** `main`
   - **Compose Path:** `docker-compose.yml`
5. En la pestaña **Environment** (opcional para personalizar contraseñas):
   ```env
   POSTGRES_USER=genesis_user
   POSTGRES_PASSWORD=tu_password_secreta_postgres
   POSTGRES_DB=genesis_db
   JWT_SECRET=tu_jwt_secret_super_seguro_2026
   ```
6. En la pestaña **Domains**:
   - Haz clic en **Add Domain**.
   - Ingresa tu dominio o subdominio (ej: `cafetin.tudominio.com`).
   - **Service / Container:** Selecciona el contenedor `frontend` (o `genesis-frontend`).
   - **Container Port:** `80`.
   - Habilita **Certificate (Let's Encrypt / HTTPS)** para SSL gratuito automático.
7. Haz clic en el botón superior **Deploy**.
   - Dokploy construirá las imágenes, iniciará PostgreSQL, migrará las tablas y creará el usuario Admin automáticamente.

---

## ⚡ Paso 3: Activar la Actualización Automática al hacer Git Push

Elige cualquiera de las dos formas siguientes (la **Opción A** es la más robusta):

### 🌟 Opción A: A través de GitHub Actions (Recomendado - Valida Seguridad antes de Desplegar)

1. En tu panel de **Dokploy**, ve a tu servicio Compose recién creado.
2. En la pestaña **Deployments** (o **General**), busca el campo **Deploy Webhook** y copia la URL que aparece:
   - Ejemplo: `https://dokploy.tu-vps.com/api/deploy/compose/deploy-webhook?token=abc123xyz...`
3. Ve a tu repositorio en **GitHub**:
   - Entra a **Settings** > **Secrets and variables** > **Actions**.
   - Haz clic en **New repository secret**.
   - **Name:** `DOKPLOY_WEBHOOK_URL`
   - **Secret:** Pega la URL del webhook que copiaste de Dokploy.
   - Haz clic en **Add secret**.

🎉 **¡Listo!** A partir de este momento, cada vez que hagas `git push origin main`:
- GitHub Actions validará el código y correrá los **23 tests de seguridad**.
- Si todo pasa con éxito, disparará el webhook de Dokploy y tu VPS se actualizará en segundos.

---

### 🚀 Opción B: Webhook Directo en GitHub (Directo y Sin GitHub Actions)

Si prefieres que GitHub le avise directamente a Dokploy sin pasar por GitHub Actions:
1. En **Dokploy**, copia la URL del **Deploy Webhook**.
2. En tu repositorio de **GitHub**, ve a **Settings** > **Webhooks** > **Add webhook**.
3. Configura:
   - **Payload URL:** Pega la URL del Webhook de Dokploy.
   - **Content type:** `application/json`
   - **Which events would you like to trigger this webhook?** `Just the push event`.
4. Haz clic en **Add webhook**.

---

## 🔑 Credenciales Iniciales en el VPS
Una vez desplegado en tu VPS, podrás ingresar de inmediato:
- **URL de la Tienda:** `https://tu-dominio.com`
- **URL del Panel:** `https://tu-dominio.com/admin/login`
- **Usuario Administrador:** `admin@genesis.com`
- **Contraseña:** `admin123`
- *(Puedes cambiar la clave y los datos del negocio en el módulo de Configuración)*.

---

## 🔍 Monitoreo de Despliegues en Dokploy
- Puedes ver el log en tiempo real de cada compilación y actualización en Dokploy en la pestaña **Deployments** > **Show Logs**.
- El sistema utiliza `npx prisma db push --accept-data-loss` y un servicio de bootstrap automático, por lo que **no requiere comandos manuales ni migraciones manuales en el VPS**.
