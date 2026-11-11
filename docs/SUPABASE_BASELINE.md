# Base verificada de Supabase

Fecha de verificación: 2026-11-11

Este documento es el punto de partida para cualquier trabajo futuro en la base de datos. No contiene secretos.

## Proyecto productivo

- Organización propietaria: `Adelayneglobalcorp's Org`.
- Referencia: `tfvlgelxqsfyjigteagy`.
- URL esperada del frontend: `https://tfvlgelxqsfyjigteagy.supabase.co`.
- Adelayne figura como Owner y NOVOeia como Developer.
- El proyecto vacío anterior `rflsfszqfxoyuidmvicf` fue eliminado y no debe utilizarse.

## Evidencia de solo lectura

| Recurso | Resultado verificado |
| --- | ---: |
| Usuarios de Auth | 31 |
| `public.properties` | 47 registros |
| `public.profiles` | 31 registros |
| `public.property_interests` | 0 registros |
| Storage | Bucket público `property-images` presente |

No se modificaron datos durante esta verificación. Los archivos del bucket no fueron enumerados.

## Configuración del frontend

El navegador solo debe recibir:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` con una clave pública/publishable válida

Nunca colocar `service_role`, claves secretas, contraseña de Postgres ni tokens administrativos en variables `VITE_*`, porque Vite las incorpora al navegador.

## Dependencias funcionales observadas

- Auth y recuperación de contraseña.
- Perfiles, roles y estado de aprobación en `profiles`.
- Lectura y gestión de `properties` y `property_images`.
- Intereses en `property_interests`.
- Carga de imágenes en el bucket `property-images`.

## Límites de esta base

- No se ha certificado un volcado completo del esquema.
- No se han auditado todas las políticas RLS, funciones, triggers, grants ni índices.
- Los scripts `.sql` de la raíz son históricos, se contradicen en algunos enfoques y no constituyen una secuencia de migraciones.
- `supabase-schema.sql` es una referencia histórica; no debe ejecutarse sobre producción.
- La interfaz usa `user_metadata` para roles en algunos puntos. Ese metadata es editable por el usuario y no debe decidir autorización; la protección debe residir en RLS y datos administrativos confiables.

## Protocolo para próximos cambios

1. Inspeccionar primero el esquema y las políticas reales en modo de solo lectura.
2. Crear una migración pequeña y reversible por cada cambio aprobado.
3. Mantener RLS activo en toda tabla expuesta y probar los roles `anon` y `authenticated`.
4. No ejecutar scripts de emergencia, desactivar RLS ni recrear tablas en producción.
5. Verificar compilación, pruebas y consultas de lectura antes de cualquier despliegue.
6. Registrar cada cambio con commit, migración y resultado de prueba.
