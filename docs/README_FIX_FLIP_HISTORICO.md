# Fix & Flip Pro - Calculadora de Inversiones y Gestión de Proyectos

Una aplicación web completa para calcular y gestionar inversiones inmobiliarias del tipo Fix & Flip (comprar, renovar y vender propiedades).

## 🚀 Características Principales

### 🧮 Calculadora de Inversiones
- **Cálculo completo de costos**: Precio de compra, costos de cierre, renovación, operativos y venta
- **Métricas financieras clave**: ROI, Cash on Cash, ganancias netas
- **Análisis de financiamiento**: Cálculo de costos de intereses y préstamos
- **Recomendaciones inteligentes**: Sistema que sugiere si la inversión es viable

### 📊 Gestión de Proyectos
- **Guardado de proyectos**: Almacena múltiples cálculos de inversión
- **Seguimiento de estado**: Activo, completado, en planificación
- **Exportación de datos**: Exporta proyectos a formato JSON
- **Visualización rápida**: Tabla resumen con métricas principales

### 📈 Reportes y Análisis
- **Gráficos interactivos**: Desglose de inversiones y tendencias de ROI
- **Reportes detallados**: Estadísticas globales de todos los proyectos
- **Análisis de rendimiento**: Tasa de éxito y métricas agregadas

## 🛠️ Instalación y Uso

### Requisitos
- Node.js 20.20.0+ y npm
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexión a internet (para cargar Bootstrap y librerías desde CDN)

### Instalación
1. Descarga o clona este repositorio
2. Instala dependencias:
   ```bash
   npm install
   ```
3. Inicia el entorno de desarrollo con Vite:
   ```bash
   npm run dev
   ```
4. Abre la URL que muestra Vite (normalmente `http://localhost:5173`)

### Build de producción
```bash
npm run build
```

### Previsualizar build
```bash
npm run preview
```

### Uso Rápido

#### 1. Calcular una Nueva Inversión
- Completa el formulario con los datos de la propiedad
- Ingresa costos de renovación (cocina, baños, pisos, etc.)
- Agrega costos operativos (permisos, seguros, impuestos)
- Configura el precio de venta estimado y costos de venta
- Los resultados se calculan automáticamente

#### 2. Guardar un Proyecto
- Después de calcular, haz clic en "Guardar Proyecto"
- Asigna un nombre y dirección al proyecto
- El proyecto se guardará localmente en tu navegador

#### 3. Gestionar Proyectos
- Ve a la sección "Proyectos" para ver todos tus cálculos guardados
- Usa los botones de acción para ver, editar o eliminar proyectos
- Exporta todos tus proyectos como archivo JSON

#### 4. Analizar Reportes
- En la sección "Reportes" visualiza gráficos de tus inversiones
- Revisa el ROI promedio y tasa de éxito
- Analiza el desglose de costos por categoría

## 📋 Campos del Formulario

### Información de Propiedad
- **Dirección**: Ubicación de la propiedad
- **Precio de Compra**: Costo de adquisición
- **Costos de Cierre**: Porcentaje adicional sobre el precio de compra

### Costos de Renovación
- **Cocina**: Costos de renovación de cocina
- **Baños**: Costos de renovación de baños
- **Pisos y Pintura**: Costos de pisos y pintura
- **Otros**: Costos adicionales de renovación

### Costos Operativos
- **Seguridad y Permisos**: Costos de permisos y licencias
- **Seguros**: Costos de seguros durante el proyecto
- **Impuestos**: Impuestos de propiedad

### Venta y Ganancias
- **Precio de Venta Estimado**: Precio esperado de venta
- **Comisión de Agente**: Porcentaje para agente inmobiliario
- **Marketing**: Costos de marketing y publicidad

### Financiamiento (Opcional)
- **Monto de Préstamo**: Si usas financiamiento
- **Tasa de Interés**: Tasa anual del préstamo
- **Duración**: Tiempo estimado del proyecto en meses

## 🧮 Fórmulas de Cálculo

### Costos Totales
```
Costo Total = Precio Compra + Costos Cierre + Renovación + Operativos
```

### Ganancias
```
Ganancia Bruta = Precio Venta - Costo Total - Costos Venta
Ganancia Neta = Ganancia Bruta - Costos Interés
```

### ROI (Return on Investment)
```
ROI = (Ganancia Neta / Inversión Total) × 100
```

### Cash on Cash ROI
```
Cash on Cash = (Ganancia Neta / Capital Propio) × 100
```

## 💾 Almacenamiento de Datos

La aplicación utiliza `localStorage` del navegador para guardar los proyectos:
- Los datos se almacenan localmente en tu dispositivo
- No se requiere conexión a servidor
- Puedes exportar tus datos como respaldo

## 🎨 Características Técnicas

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Framework**: Bootstrap 5 para diseño responsivo
- **Gráficos**: Chart.js para visualizaciones
- **Iconos**: Bootstrap Icons
- **Almacenamiento**: LocalStorage API
- **Diseño**: Responsivo, funciona en móviles y escritorio

## ⌨️ Atajos de Teclado

- **Ctrl+S**: Guardar proyecto actual
- **Ctrl+N**: Nuevo proyecto (limpiar formulario)

## 🌟 Mejores Prácticas

1. **Precisión en los datos**: Ingresa valores lo más exactos posibles
2. **Conservador en estimados**: Es mejor subestimar ganancias que sobreestimarlas
3. **Incluye todos los costos**: No olvides costos ocultos como impuestos y seguros
4. **Revisa regularmente**: Actualiza los proyectos con datos reales
5. **Exporta tus datos**: Haz respaldos periódicos de tus proyectos

## 🔧 Personalización

La aplicación es fácil de personalizar:
- Modifica `styles.css` para cambiar colores y diseño
- Edita `script.js` para agregar nuevas métricas
- Actualiza `index.html` para agregar nuevos campos

## 📱 Compatibilidad

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Móviles y tablets

## 🤝 Contribuciones

¡Bienvenidas las contribuciones! Si encuentras algún error o tienes sugerencias:
1. Reporta issues en el repositorio
2. Envía pull requests con mejoras
3. Comparte tus ideas para nuevas funcionalidades

## 📄 Licencia

Este proyecto es de código abierto y disponible bajo la Licencia MIT.

---

**Fix & Flip Pro** - Tu herramienta definitiva para inversiones inmobiliarias

*Desarrollado con ❤️ para inversores inmobiliarios*
