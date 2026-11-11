# Guía de despliegue — pendiente

Netlify es la plataforma de despliegue confirmada para Inventory. El trabajo de Netlify fue aplazado por decisión del cliente y este documento no autoriza una publicación.

## Estado conocido

- Sitio actual: `admin360inventoryadelayne.netlify.app`.
- Site ID confirmado: `9bc9df82-cb70-4230-b4e0-64b14e24defd`.
- Propietario actual: equipo NOVOeia.
- Repositorio conectado actualmente: `NOVOeia/git-sync-project-cb8f73b7`.
- Producción observada: `main@9528aa3`, publicada el 20 de octubre de 2026.
- Variables de entorno observadas: ninguna.
- Repositorio futuro: `Adelayneglobalcorp/Inventory` después de aprobar y fusionar el PR de migración.

## Configuración prevista

- Comando de compilación: `npm run build`.
- Directorio publicado: `dist`.
- Redirección SPA: definida en `netlify.toml`.
- Variables obligatorias: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `VITE_SITE_URL`.
- Los webhooks de integraciones externas quedan sin configurar porque pertenecen a otro equipo.

## Secuencia cuando se retome

1. Confirmar el equipo Netlify del cliente.
2. Transferir el sitio sin cambiar todavía la producción.
3. Confirmar que el PR de migración esté aprobado y fusionado en `main`.
4. Conectar `Adelayneglobalcorp/Inventory` y configurar las variables sin revelar sus valores.
5. Generar una vista previa y probar login, propiedades, imágenes e intereses.
6. Publicar en producción únicamente con confirmación explícita.

## Vistas previas para los próximos ajustes

Cada tarea pendiente se desarrollará en una rama separada. Después de aprobar pruebas y compilación, se generará una vista previa vinculada al Site ID confirmado. Esa vista tendrá una URL independiente para que el cliente pueda revisar el avance sin reemplazar el sitio productivo.

Flujo acordado:

1. Crear rama y PR para el ajuste.
2. Ejecutar pruebas y compilación.
3. Crear Deploy Preview, nunca un despliegue de producción.
4. Compartir la URL de prueba y registrar el commit exacto.
5. Corregir y repetir la vista previa hasta recibir aprobación.
6. Fusionar y publicar únicamente con confirmación.

El Site ID identifica el sitio, pero no concede acceso. Para operar Netlify en segundo plano será necesaria una autenticación de Netlify una sola vez; no se guardará el token en Git.

No usar configuraciones de Vercel ni ejecutar SQL como parte del despliegue.
