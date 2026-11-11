# Inventory — Adelayne Global Corp

Código fuente de **Inventory / Admin 360**, con listados de propiedades, autenticación, calculadora Fix & Flip, Deals y Project Manager.

## Estado actual

- El código productivo fue migrado desde `NOVOeia/git-sync-project-cb8f73b7` y está en la rama `codex/migrate-production-source`.
- La incorporación a `main` se revisa en el PR #1 de `Adelayneglobalcorp/Inventory`.
- El ZIP histórico `CalculatorFix-flip-main.zip` y la documentación anterior se conservaron.
- Supabase productivo pertenece a la organización de Adelayne y conserva el identificador `tfvlgelxqsfyjigteagy`.
- Netlify quedó aplazado; no se ha realizado un nuevo despliegue.

## Preparación local

1. Instalar dependencias con `npm ci`.
2. Copiar `.env.example` como `.env.local`.
3. Completar únicamente la URL y la clave pública de Supabase. Nunca usar `service_role` en el frontend.
4. Ejecutar `npm run validate` para correr pruebas y compilación.
5. Iniciar el proyecto con `npm run dev`.

## Variables requeridas

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SITE_URL`

Los webhooks son opcionales y están documentados en `.env.example`.

## Documentación vigente

- [Estado y próximos pasos](docs/ESTADO_Y_PLAN.md)
- [Base verificada de Supabase](docs/SUPABASE_BASELINE.md)
- [Informe de migración](docs/MIGRATION_REPORT.md)
- [Guía de despliegue aplazado](DEPLOYMENT_GUIDE.md)

## Seguridad de la base de datos

Los archivos SQL de la raíz provienen del proyecto histórico. **No deben ejecutarse en el Supabase productivo como un paquete ni considerarse migraciones vigentes.** Algunos son diagnósticos o correcciones incompatibles entre sí. Toda modificación futura debe partir del esquema real, usar una migración revisada y probarse sin borrar datos.

No guardar contraseñas, tokens, claves privadas, `service_role` ni archivos `.env` en Git.
