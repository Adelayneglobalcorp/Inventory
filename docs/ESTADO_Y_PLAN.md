# Estado y plan de continuidad — Inventory

Fecha de actualización: 2026-11-11

## Base completada

- Código productivo completo migrado como archivos normales al repositorio del cliente.
- ZIP histórico y documentación del repositorio cliente preservados.
- Rama de respaldo: `backup/pre-migration-2026-11-11`.
- Rama de trabajo: `codex/migrate-production-source`.
- PR de migración: `Adelayneglobalcorp/Inventory#1` (borrador, pendiente de revisión y fusión).
- `.env` excluido del repositorio y configuración sensible sustituida por variables de entorno.
- Compilación aprobada y prueba automatizada aprobada.
- Supabase productivo transferido a la organización de Adelayne sin cambiar su identificador.
- Verificación de solo lectura completada sin modificar datos.

## Supabase confirmado

- Proyecto: `tfvlgelxqsfyjigteagy`.
- Auth: 31 usuarios.
- `properties`: 47 registros.
- `profiles`: 31 registros.
- `property_interests`: 0 registros.
- Storage: bucket público `property-images` presente.

La estructura completa, políticas RLS, funciones y triggers todavía no han sido certificados como una migración reproducible. Los scripts SQL históricos de la raíz no son una fuente de verdad y no deben ejecutarse indiscriminadamente.

## Pendientes técnicos conocidos

- El PR aún no está fusionado con `main`.
- Lint heredado: 94 errores y 15 advertencias.
- Auditoría de dependencias heredada: 32 hallazgos.
- Paquete principal aproximado de 1.74 MB.
- La aplicación utiliza `user_metadata` como ayuda para mostrar roles en algunos flujos. La autorización real debe depender de la tabla `profiles` y de RLS; esto debe corregirse y verificarse antes de ampliar el registro automático.
- El flujo actual mantiene aprobación manual para usuarios generales; su eliminación forma parte de la tarea pendiente de registro automático.
- Netlify está aplazado por decisión del cliente y no se debe tocar hasta retomarlo.

## Orden recomendado de continuación

1. Revisar y fusionar el PR de migración cuando se apruebe la base.
2. Auditar RLS, roles, trigger de perfiles y Storage contra el esquema real, sin modificar datos.
3. Implementar registro automático seguro para inversionistas generales, manteniendo administración protegida.
4. Completar y probar textos ES/EN.
5. Reactivar y probar Inventory, Calculator, Deals y Project Manager.
6. Corregir lint, dependencias y tamaño del paquete en cambios separados.
7. Retomar Netlify al final, configurar variables y desplegar solo con confirmación.

## Trabajo funcional y de diseño incluido

- Crear, ajustar y diseñar las pantallas y flujos aprobados dentro de Inventory.
- Registro automático seguro para usuarios generales.
- Administración, roles y permisos protegidos.
- Experiencia completa en español e inglés.
- Inventory, Calculator, Deals y Project Manager.
- Módulo de solicitudes de financiamiento y su persistencia en Supabase.
- Vistas previas para revisar cada avance antes de producción.

## Fuera del alcance actual

- Automatización de Dropbox o Google Drive.
- Conexión, configuración o automatización de GoHighLevel/LeadConnector. Otro equipo será responsable de esa integración.
- Cambios destructivos o reinicialización de la base de datos.
- Despliegue de Netlify sin confirmación.
