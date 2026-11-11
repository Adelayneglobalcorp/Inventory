# Real Estate Inventory Management System 

Sistema completo de gestión de propiedades inmobiliarias con roles de usuario, administración y panel de control.

## 🚀 **Demo en Vivo**

**URL de Pruebas:** [https://inventory-demo.novoeia.com](https://inventory-demo.novoeia.com)

**Credenciales de Demo:** no se publican en el repositorio. Solicítalas por un canal seguro.

## ✨ **Características**

### 🔐 **Sistema de Autenticación**
- Login y registro de usuarios
- Roles: Admin, Usuario, Inversionista, Agente
- Confirmación de email y aprobación de usuarios
- Recuperación de contraseña

### 🏠 **Gestión de Propiedades**
- CRUD completo de propiedades
- Galería de imágenes múltiples
- Filtros avanzados (precio, ubicación, estado)
- Cálculos financieros (ROI, ARV, Cap Rate)

### 👥 **Administración de Usuarios**
- Panel de administración completo
- Gestión de roles y permisos
- Aprobación de usuarios pendientes
- Generación de códigos de admin

### 📊 **Dashboard y Reportes**
- Estadísticas en tiempo real
- Gráficos de propiedades
- Métricas de inversión
- Actividad reciente

## 🛠️ **Tecnologías**

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **UI:** Tailwind CSS + Radix UI
- **Estado:** React Query + Context API
- **Build:** Vite + React Router

## 🚀 **Instalación Local**

```bash
# Clonar el repositorio
git clone https://github.com/NOVOeia/git-sync-project-cb8f73b7.git
cd git-sync-project-cb8f73b7

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# Iniciar desarrollo
npm run dev
```

## 📋 **Variables de Entorno**

```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

## 🎯 **Guía de Despliegue**

### Vercel (Recomendado)
1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Despliegue automático en cada push

### Netlify
1. Conectar repositorio a Netlify
2. Configurar build command: `npm run build`
3. Configurar publish directory: `dist`

### Railway
1. Conectar repositorio a Railway
2. Configurar variables de entorno
3. Despliegue automático

## 📞 **Soporte**

- **Email:** soporte@novoeia.com
- **GitHub:** https://github.com/NOVOeia/git-sync-project-cb8f73b7/issues
- **Documentación:** https://docs.novoeia.com/inventory

## 📄 **Licencia**

MIT License - Ver archivo [LICENSE](LICENSE) para más detalles.

---

**Desarrollado con ❤️ por [NOVOeia](https://novoeia.com)**

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
