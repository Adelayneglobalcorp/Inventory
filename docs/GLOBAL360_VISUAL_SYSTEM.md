# Global 360 — sistema visual de aplicación (en revisión)

## Identidad

**Global 360 by Adelayne Global Corp.** identifica la aplicación completa. **Inventory** sigue siendo el nombre exclusivo del módulo de propiedades. Otros módulos: Fix & Flip Calculator, Deals, Project Manager y Financing.

Logos aprobados y suministrados por el cliente:
- Fondo oscuro: `https://files.leadconnectorhq.com/file/6af63a7b9b3d448d8097c582/global-360-fondos-oscuros.png`
- Fondo claro: `https://files.leadconnectorhq.com/file/6af63a7b9b3d448d8097c581/global-360-fondos-claros.png`

Se usan en `src/components/branding/Global360Brand.tsx`. El encabezado utiliza el emblema original recortado de la imagen y texto adaptable. El favicon `public/global360-icon.svg` es un isotipo simplificado para tamaños diminutos; no reemplaza la ilustración oficial.

## Mensaje y tono

Título del login: **«Transforma propiedades en grandes oportunidades.»**

Texto de apoyo: **«Herramientas y recursos para aprender, analizar y gestionar proyectos Fix & Flip a tu ritmo.»**

No presentar Global 360 como plataforma oficial de inversiones, no prometer rentabilidades, aprobaciones de financiación o resultados financieros. Mantener todos los textos relevantes en ES/EN.

## Estilo visual

- Azul noche `#06172e`, azul base `#0c2440`, sombras profundas.
- Oro champagne `#edbf50` y luces doradas discretas; acentos blanco cálido.
- Tarjetas redondeadas, bordes finos, sombras suaves, excelente legibilidad.
- Animaciones cortas y no invasivas; respetar `prefers-reduced-motion`.
- Primera pantalla: composición editorial en dos columnas en escritorio; formulario accesible rápidamente en móvil.
- Antes/después: dos fotos **ilustrativas** de viviendas (no son una transformación documentada de la misma propiedad). En esta rama se cargan temporalmente desde Unsplash; antes de publicar, sustituirlas por un recurso definitivo aprobado y alojado por Adelayne, idealmente una composición de la misma casa tipo Florida.
- Franja inferior: solo tres iconos discretos (Inventory, Calculadora, Project Manager).

## Funcionalidad preservada

- Auth mediante `useAuth()`: login, creación de cuenta, recuperación y restablecimiento de contraseña.
- Campo telefónico, validación de teléfono, roles, idioma ES/EN.
- Datos, cálculos y acciones de la calculadora y los demás módulos.
- Integraciones Supabase/GHL. **No modificar** Edge Functions, triggers, esquema, webhooks ni secretos durante este rediseño.

## Alcance de la rama

- `/login`, `/forgot-password`, `/reset-password`
- Header global, nombre en dashboard, favicon, títulos y social preview.
- Encabezados interiores de Inventory, Deals, Project Manager y Financing.
- Estilo compartido Global 360 en `src/index.css`.

## Protocolo de integración y publicación

Esta rama es **solo de diseño**. No fusionar a `main` ni desplegar a Netlify hasta la orden expresa del cliente. El equipo de GHL está modificando `main` en paralelo: antes de fusionar, traer los cambios recientes de `main` a esta rama, resolver cualquier conflicto con prioridad en conservar las integraciones, correr TypeScript, pruebas, build y revisar el resultado visual del login en móvil y escritorio.

La workflow `.github/workflows/global360-design-check.yml` hace comprobaciones de código y compilación solamente: no publica archivos, no modifica Netlify y no despliega.
