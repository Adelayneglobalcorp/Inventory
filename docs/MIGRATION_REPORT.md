# Informe de migración de código

Fecha de revisión: 2026-11-11

## Trazabilidad

- Origen: `NOVOeia/git-sync-project-cb8f73b7`
- Commit origen verificado: `9528aa35b8b5a446771fb4c1e4023e7eb0fd349b`
- Destino: `Adelayneglobalcorp/Inventory`
- Base del destino: `5efb3f8fd4adc85feae900d62268e40057b4494e`
- Respaldo remoto: `backup/pre-migration-2026-11-11`
- Rama de trabajo: `codex/migrate-production-source`

Se compararon los 210 archivos del código origen contra sus identificadores Git: no hubo archivos faltantes, adicionales ni diferencias. El ZIP histórico, el README del cliente y la documentación existente del repositorio destino se conservaron.

## Seguridad aplicada

- El archivo `.env` del origen no fue migrado.
- `.env` y sus variantes quedaron excluidos de Git, salvo `.env.example`.
- Se retiraron credenciales y direcciones privadas incorporadas directamente en el código.
- Los webhooks ahora se obtienen únicamente de variables de entorno.
- Se eliminaron contraseñas y hashes de ejemplo de la documentación y los scripts SQL.

## Verificaciones

- Compilación de producción: aprobada.
- Prueba automatizada: 1 de 1 aprobada.
- Revisión de formato Git: el código origen conserva espacios finales preexistentes; no bloquean la compilación, pero quedan como deuda de formato.
- Lint: pendiente; 94 errores y 15 advertencias preexistentes.
- Dependencias: `npm audit` reporta 32 hallazgos (1 bajo, 8 moderados, 20 altos y 3 críticos). No se ejecutó una corrección automática por su riesgo de cambios incompatibles.
- Tamaño: el paquete principal generado es de aproximadamente 1.74 MB y produce una advertencia de optimización.

## Servicios externos y bloqueos

- El proyecto Supabase productivo original `tfvlgelxqsfyjigteagy` fue transferido correctamente a `Adelayneglobalcorp's Org` el 11 de noviembre de 2026. Conservó su identificador, URL, base de datos, autenticación y configuración. `adelaynegmarketing@gmail.com` figura como Owner y `team@novoeia.com` como Developer.
- La verificación posterior a la transferencia confirmó 31 usuarios de Auth y acceso de solo lectura a las tablas principales: `properties` (47 registros), `profiles` (31 registros) y `property_interests` (0 registros). No se modificaron datos. No aparecen buckets ni archivos en Storage.
- El proyecto vacío `rflsfszqfxoyuidmvicf` fue eliminado antes de la transferencia y ya no debe utilizarse en la aplicación ni en Netlify.
- La arquitectura confirmada por el cliente usa Supabase para datos y autenticación, y Netlify para el despliegue. GitHub conserva registros históricos de Vercel que no representan el despliegue actual y deben tratarse como obsoletos. La configuración `netlify.toml` está incluida y la compilación local fue aprobada, pero no se inició ni se confirmó ningún despliegue en Netlify.

La base de Supabase ya está verificada y no requiere una migración de datos adicional. Antes de continuar con reactivación, idiomas y registro automático, queda confirmar el sitio correcto de Netlify y que sus variables de entorno apunten al proyecto conservado `tfvlgelxqsfyjigteagy`.
