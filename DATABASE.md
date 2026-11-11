# Documentación de la Base de Datos - Sistema de Gestión de Propiedades

## 📋 Resumen

Este documento describe la estructura de la base de datos creada en Supabase para el sistema de gestión de propiedades inmobiliarias.

## 🗄️ Tablas Principales

### 1. `profiles` - Perfiles de Usuario
**Propósito:** Almacenar información de los usuarios registrados.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Referencia a auth.users (PK) |
| `email` | TEXT | Email único del usuario |
| `full_name` | TEXT | Nombre completo |
| `phone` | TEXT | Teléfono (opcional) |
| `company` | TEXT | Empresa (opcional) |
| `avatar_url` | TEXT | URL de foto de perfil |
| `role` | TEXT | Rol: 'admin', 'investor', 'agent' |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Última actualización |

### 2. `properties` - Propiedades
**Propósito:** Almacenar información detallada de las propiedades inmobiliarias.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | ID único de la propiedad (PK) |
| `title` | TEXT | Título/descripción corta |
| `address` | TEXT | Dirección completa |
| `city` | TEXT | Ciudad |
| `state` | TEXT | Estado/Provincia |
| `zip_code` | TEXT | Código postal |
| `price` | DECIMAL(12,2) | Precio actual |
| `arv` | DECIMAL(12,2) | After Repair Value |
| `roi` | DECIMAL(5,2) | Return on Investment (%) |
| `bedrooms` | INTEGER | Número de habitaciones |
| `bathrooms` | DECIMAL(3,1) | Número de baños |
| `sqft` | INTEGER | Metros cuadrados |
| `year_built` | INTEGER | Año de construcción |
| `status` | TEXT | Estado: 'available', 'on_sale', 'sold' |
| `property_type` | TEXT | Tipo de propiedad |
| `description` | TEXT | Descripción completa |
| `image_url` | TEXT | URL de imagen principal |
| `gallery` | TEXT[] | Array de URLs de imágenes |
| `rehab_cost` | DECIMAL(12,2) | Costo de renovación |
| `monthly_rent` | DECIMAL(10,2) | Renta mensual |
| `cap_rate` | DECIMAL(5,2) | Capitalization Rate (%) |
| `owner_id` | UUID | Referencia al propietario (FK) |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Última actualización |

### 3. `property_images` - Imágenes de Propiedades
**Propósito:** Gestión múltiple de imágenes por propiedad.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | ID único (PK) |
| `property_id` | UUID | Referencia a propiedad (FK) |
| `url` | TEXT | URL de la imagen |
| `alt_text` | TEXT | Texto alternativo |
| `is_primary` | BOOLEAN | ¿Es imagen principal? |
| `sort_order` | INTEGER | Orden de visualización |
| `created_at` | TIMESTAMP | Fecha de creación |

### 4. `offers` - Ofertas
**Propósito:** Gestionar ofertas sobre propiedades.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | ID único (PK) |
| `property_id` | UUID | Referencia a propiedad (FK) |
| `buyer_id` | UUID | Referencia al comprador (FK) |
| `amount` | DECIMAL(12,2) | Monto de la oferta |
| `status` | TEXT | Estado: 'pending', 'accepted', 'rejected', 'withdrawn' |
| `message` | TEXT | Mensaje de la oferta |
| `expires_at` | TIMESTAMP | Fecha de expiración |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Última actualización |

### 5. `property_tours` - Visitas a Propiedades
**Propósito:** Agendar y gestionar visitas.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | ID único (PK) |
| `property_id` | UUID | Referencia a propiedad (FK) |
| `visitor_id` | UUID | Referencia al visitante (FK) |
| `scheduled_at` | TIMESTAMP | Fecha y hora programada |
| `duration_minutes` | INTEGER | Duración en minutos |
| `status` | TEXT | Estado: 'scheduled', 'completed', 'cancelled' |
| `notes` | TEXT | Notas adicionales |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Última actualización |

## 🔗 Relaciones entre Tablas

```
profiles (1) ←→ (N) properties
  ↓                    ↓
offers (N) ←→ (1) properties
  ↓
property_tours (N) ←→ (1) properties
  ↓
property_images (N) ←→ (1) properties
```

## 🔐 Seguridad (RLS - Row Level Security)

### Políticas Implementadas:

- **Profiles:** Los usuarios solo pueden ver y modificar su propio perfil
- **Properties:** 
  - Cualquiera puede ver propiedades
  - Solo los propietarios pueden modificar/eliminar sus propiedades
  - Usuarios autenticados pueden crear propiedades
- **Property Images:** 
  - Cualquiera puede ver imágenes
  - Solo propietarios pueden gestionar imágenes de sus propiedades
- **Offers:** 
  - Compradores y propietarios pueden ver ofertas relevantes
  - Compradores pueden crear y modificar sus ofertas
- **Property Tours:** 
  - Visitantes y propietarios pueden ver tours relevantes
  - Usuarios autenticados pueden crear tours

## 🚀 Funciones Automáticas

### Triggers:
1. **`handle_updated_at`**: Actualiza automáticamente `updated_at` en todas las tablas
2. **`handle_new_user`**: Crea perfil automáticamente cuando un usuario se registra en Supabase Auth

### Vistas Útiles:
1. **`property_details`**: Vista completa de propiedades con información del propietario
2. **`offer_details`**: Vista de ofertas con información del comprador y propiedad

## 📊 Índices Optimizados

Se han creado índices para optimizar las consultas más frecuentes:
- Búsqueda por email y rol en profiles
- Búsqueda por propietario, estado, ciudad, precio en properties
- Índices compuestos para relaciones y búsquedas específicas

## 🛠️ Instalación

1. Ve al panel de Supabase
2. Navega a "SQL Editor"
3. Copia y ejecuta el contenido del archivo `supabase-schema.sql`
4. Verifica que todas las tablas se hayan creado correctamente

## 🔄 Mantenimiento

- Los timestamps se actualizan automáticamente
- Los perfiles se crean automáticamente al registrar usuarios
- Las políticas de seguridad aseguran que los datos solo sean accesibles por usuarios autorizados

## 📝 Notas Adicionales

- La tabla `profiles` está directamente relacionada con `auth.users` de Supabase
- Se utiliza UUID como identificadores principales para mejor seguridad y escalabilidad
- Los arrays de PostgreSQL se utilizan para galerías de imágenes
- Las vistas simplifican consultas complejas en la aplicación
