# Estado del repositorio — Inventory / Adelayne Global

Fecha de revisión: 2026-11-11

## Qué existe en la rama main
- `CalculatorFix-flip-main.zip`: paquete comprimido que contiene una versión de Fix & Flip. Su contenido interno no ha podido validarse con el conector de GitHub (archivo binario).
- `README.md`: documentación histórica de "Fix & Flip Pro", no verificada como descripción de la aplicación completa.

**No existen archivos fuente extraídos en la raíz de main** (`src/`, `package.json`, `vite.config.*`, etc.). Por tanto, **no es posible conectar este estado de main directamente a un build típico de Netlify de React/Vite** ni afirmar que contiene Inventory Admin 360 desplegable. El ZIP se conserva sin cambios.

## Alcance aprobado por el cliente
1. A1 — Migración/configuración de GitHub, Netlify y Supabase del cliente.
2. A2 — Reactivación de Inventory, Calculator, Deals y Project Manager existentes.
3. A3 — Correcciones de traducción ES/EN.
4. A4 — Registro automático de inversionistas generales sin aprobación administrativa manual, con permisos seguros.
5. B2 — Módulo de solicitud de financiamiento, Supabase, integración GoHighLevel y notificación.

**Fuera del alcance**: automatización de Dropbox / Google Drive. **Pendiente de aprobación**: B1, actualización de estados por instrucciones.

## Preparación técnica antes de desarrollar
1. Identificar y respaldar el código fuente real de producción (no reemplazarlo por una calculadora histórica).
2. Incorporar el código fuente descomprimido al repositorio del cliente, revisando archivos privados como `.env` y credenciales.
3. Verificar `package.json`, build, variables de entorno y configuración de Netlify.
4. Verificar que la aplicación apunte al proyecto correcto de Supabase y proteger los datos existentes.
5. Crear una rama para cada cambio, probar y desplegar solo después de aprobar la versión.

## Referencias identificadas para revisión
- Repositorio cliente: https://github.com/Adelayneglobalcorp/Inventory
- Posible fuente de aplicación integral: https://github.com/NOVOeia/git-sync-project-cb8f73b7 (debe validarse que corresponda a la versión de producción)
- Sitio de administración reportado: https://admin360inventoryadelayne.netlify.app
- Supabase cliente reportado: `tfvlgelxqsfyjigteagy`

## Precauciones
- No modificar, borrar ni recrear las propiedades y usuarios existentes durante la preparación.
- No publicar secretos, llaves privadas o tokens en el repositorio.
- Los datos de Deals y Project Manager pueden depender de `localStorage`; cualquier migración de esa persistencia exige evaluación independiente.
