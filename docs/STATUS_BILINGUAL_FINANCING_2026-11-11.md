# Continuidad — idiomas ES/EN y solicitudes de financiamiento
Fecha: 2026-11-11

## Proyecto autorizado
- Repositorio: `Adelayneglobalcorp/Inventory`
- Supabase correcto: `tfvlgelxqsfyjigteagy`
- Netlify existente: `admin360inventoryadelayne.netlify.app`
- Rama de código ya migrado: `codex/migrate-production-source`
- Rama de esta tarea: `feature/bilingual-financing-20261111`
- Pull request de esta tarea: https://github.com/Adelayneglobalcorp/Inventory/pull/2 (borrador hacia la rama migrada)
- PR de migración a main: #1, pendiente.

## Ejecutado en GitHub
- Traducciones de navegación, roles y selector ES/EN.
- Claves de traducción completas y simétricas en el diccionario central (315 claves por idioma en la revisión de esta fecha).
- Etiquetas y mensajes traducidos de Dashboard, Deals, Calculator y varias pantallas de Project Manager.
- Pantalla `/financing`, protegida por autenticación, con formulario bilingüe, validación y envío a `financing_requests` cuando la tabla esté disponible.
- Migración SQL preparada en `supabase/migrations/20261111211500_create_financing_requests.sql`, con RLS para solicitantes y administradores.
- Validación explícita de que la URL de Supabase del frontend corresponde a Adelayne.
- Archivo de workflow GitHub Actions para `npm run validate`.

## Verificaciones realizadas
- Relectura remota de las rutas, menú y archivos de financiamiento en GitHub.
- Diccionario ES/EN parseable y 315 claves por idioma; ninguna clave faltante.
- Se confirmó en código que el formulario apunta a `public.financing_requests`.
- **No consta que el workflow CI haya ejecutado**, ni se obtuvo compilación nueva en esta sesión. No afirmar pruebas funcionales completas.

## Pendiente / bloqueo real
1. Supabase de Adelayne **no está autorizado** en la conexión Supabase disponible en este chat. La consulta de tablas por ref devuelve PERMISSION DENIED. No se ejecutó migración ni se modificaron registros.
2. Netlify no dispone de una conexión operable desde este chat, y el sitio existente sigue conectado al origen anterior según la auditoría de migración. No se cambió el dominio ni se publicó producción.
3. Debe comprobarse compilación, interacción y traducción de todas las pantallas, incluidas las etiquetas internas heredadas de Project Manager y sus paneles.
4. Una vez concedidos los accesos oficiales, validar esquema y RLS de la tabla, aplicar migración, configurar variables públicas de Supabase, crear Deploy Preview, probar ES/EN y publicar.
5. Integración GoHighLevel es responsabilidad del cliente, fuera de esta implementación.

## Seguridad
No se alteraron las 47 propiedades existentes, los 31 perfiles ni los usuarios Auth reportados en la auditoría previa. No introducir credenciales privadas en Git y no ejecutar los scripts SQL históricos de la raíz.
