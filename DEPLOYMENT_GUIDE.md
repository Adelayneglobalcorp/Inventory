# 🚀 Guía de Publicación de la Aplicación

## Opciones para Publicar en Internet

### 1. 🌐 **Vercel (Recomendado para React)**
**Gratis para proyectos personales**

#### Pasos:
```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Iniciar sesión
vercel login

# 3. Desplegar desde tu proyecto
cd /Users/diegoforero/Documents/Inventory\ New/git-sync-project-cb8f73b7
vercel

# 4. Seguir las instrucciones:
# - Conectar tu cuenta GitHub
# - Importar el repositorio
# - Configurar variables de entorno
```

#### Variables de Entorno Necesarias:
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

---

### 2. 🐳 **Netlify (Alternativa Gratuita)**

#### Pasos:
1. Ve a [netlify.com](https://netlify.com)
2. Conecta tu cuenta GitHub
3. Importa el repositorio: `git-sync-project-cb8f73b7`
4. Configura el build:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Node version:** `18`

---

### 3. 🚀 **Render (Opción Profesional)**

#### Pasos:
1. Ve a [render.com](https://render.com)
2. Crea un "Web Service"
3. Conecta tu repositorio GitHub
4. Configura:
   - **Build Command:** `npm run build`
   - **Start Command:** `npm run dev`
   - **Node Version:** `18`

---

### 4. 🔧 **Configuración de Supabase para Producción**

#### A. Configurar CORS:
```sql
-- En Supabase SQL Editor
ALTER TABLE public.profiles 
ENABLE ROW LEVEL SECURITY;

-- Configurar CORS para tu dominio
INSERT INTO cors (
  origin, 
  is_default, 
  max_age, 
  methods, 
  headers
) VALUES (
  'https://tu-dominio.vercel.app', 
  false, 
  3600, 
  'GET,POST,PUT,DELETE,OPTIONS', 
  'Content-Type,Authorization'
);
```

#### B. Configurar RLS (Row Level Security):
```sql
-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
```

---

### 5. 📱 **Configuración del Frontend**

#### A. Actualizar variables de entorno:
```bash
# .env.production
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

#### B. Build de producción:
```bash
npm run build
npm run preview
```

---

### 6. 🌍 **Dominio Personalizado (Opcional)**

#### En Vercel:
1. Ve al dashboard de Vercel
2. Click en "Domains"
3. Añade tu dominio: `tu-propiedad.com`
4. Configura DNS según las instrucciones

#### En Netlify:
1. Ve a "Site settings > Domain management"
2. Añade tu dominio personalizado
3. Configura los registros DNS

---

### 7. 📊 **Monitoreo y Analytics**

#### A. Google Analytics:
```html
<!-- En public/index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

#### B. Vercel Analytics:
- Automáticamente incluido en Vercel
- Ve a "Analytics" en el dashboard

---

### 8. 🔒 **Seguridad Adicional**

#### A. Configurar HTTPS:
- Vercel y Netlify incluyen HTTPS gratuito
- Certificado SSL automático

#### B. Variables de entorno seguras:
```bash
# Nunca exponer keys sensibles en el frontend
# Usa solo las keys públicas de Supabase
```

---

### 9. 🚀 **Pasos Finales de Despliegue**

#### Checklist antes de publicar:
- [ ] Configurar variables de entorno en producción
- [ ] Probar build local: `npm run build`
- [ ] Verificar que Supabase permite tu dominio
- [ ] Configurar RLS policies
- [ ] Probar login y funciones principales

---

### 10. 📞 **Soporte y Mantenimiento**

#### A. Logs y errores:
- Vercel: Dashboard > Functions > Logs
- Netlify: Site settings > Tools > Edge Functions
- Render: Dashboard > Logs

#### B. Actualizaciones:
```bash
# Cada vez que hagas cambios en GitHub
git add .
git commit -m "Update: descripción del cambio"
git push origin main

# Los servicios se despliegan automáticamente
```

---

## 🎯 **Recomendación Final**

**Para empezar rápido:** Usa **Vercel** - Es el más fácil para React y tiene un excelente free tier.

**Para producción:** Considera **Render** - Más control y mejor para aplicaciones complejas.

**Para presupuesto limitado:** **Netlify** - Excelente free tier y fácil de usar.

---

## 🚀 **Comandos Rápidos**

```bash
# Para Vercel
vercel --prod

# Para Netlify
npm run build
netlify deploy --prod --dir=dist

# Para local testing
npm run build
npm run preview
```
