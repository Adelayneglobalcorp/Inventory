# Inventory — Adelayne Global Corp

Repositorio del cliente para la plataforma inmobiliaria **Inventory / Admin 360**, incluyendo las funcionalidades existentes de listados, calculadora Fix & Flip, Deals y Project Manager.

> **Estado al 11 de noviembre de 2026:** repositorio en preparación. La rama `main` contiene un paquete ZIP histórico de Fix & Flip; **todavía no contiene el código fuente desplegable completo** de Inventory Admin 360. No configurar Netlify para construir directamente desde esta rama hasta incorporar y verificar el proyecto completo.

## Archivos actuales

- `CalculatorFix-flip-main.zip` — ZIP legado, conservado sin alteraciones.
- `docs/README_FIX_FLIP_HISTORICO.md` — documentación original de la calculadora.
- `docs/ESTADO_Y_PLAN.md` — auditoría de contenido, alcance aprobado y siguientes pasos.

## Desarrollo aprobado

- Migración y configuración GitHub / Netlify / Supabase.
- Reactivación de Inventory, Calculator, Deals y Project Manager.
- Corrección integral de textos ES/EN del alcance existente.
- Registro general de inversionistas sin aprobación administrativa.
- Módulo de solicitudes de financiamiento integrado con Supabase y GoHighLevel.

La importación automática desde Dropbox/Google Drive **no está aprobada**. La actualización por instrucciones del estado de propiedades está **pendiente**.

## Próximo paso

Confirmar el código fuente de producción, incorporarlo como archivos de proyecto y validar build/deploy sin afectar datos ni usuarios existentes. Ver [estado y plan](docs/ESTADO_Y_PLAN.md).

**Nota de seguridad:** no incorporar credenciales privadas, claves de servicio, contraseñas ni tokens en el repositorio público.
