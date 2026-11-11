# Guía de despliegue — pendiente

Netlify es la plataforma de despliegue confirmada para Inventory. El trabajo de Netlify fue aplazado por decisión del cliente y este documento no autoriza una publicación.

## Estado conocido

- Sitio actual: `admin360inventoryadelayne.netlify.app`.
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
- Variables opcionales: webhooks descritos en `.env.example`.

## Secuencia cuando se retome

1. Confirmar el equipo Netlify del cliente.
2. Transferir el sitio sin cambiar todavía la producción.
3. Confirmar que el PR de migración esté aprobado y fusionado en `main`.
4. Conectar `Adelayneglobalcorp/Inventory` y configurar las variables sin revelar sus valores.
5. Generar una vista previa y probar login, propiedades, imágenes e intereses.
6. Publicar en producción únicamente con confirmación explícita.

No usar configuraciones de Vercel ni ejecutar SQL como parte del despliegue.
