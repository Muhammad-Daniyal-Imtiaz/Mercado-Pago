# Sistema de Billing y Facturación

## Resumen de la Implementación

He creado un sistema completo de billing y facturación con las siguientes características:

### 1. Base de Datos (SQL)
**Archivo:** `/sql/update_accounts_table.sql`

- **Tabla `accounts`** extendida con campos de facturación
- **Tabla `invoices`** para gestión de facturas
- **Tabla `payments`** para registro de pagos
- **Tabla `subscriptions`** para tracking de planes
- Índices optimizados y triggers automáticos

### 2. Encriptación de Datos Sensibles
**Archivo:** `/src/lib/billing/crypto.ts`

- Encriptación AES-256-GCM para datos de pago
- Separación de datos públicos vs sensibles
- Validación de tarjetas (Luhn algorithm)
- Detección automática de marca de tarjeta

### 3. Interfaz para Sysadmin
**Archivo:** `/src/app/dashboard/sysadmin/billing/page.tsx`

- Vista completa de todas las cuentas
- Gestión de estados (activar/suspender)
- Estadísticas generales
- Edición de planes y métodos de pago
- Visualización de uso por cliente

### 4. Interfaz para Account Admin
**Archivo:** `/src/app/dashboard/account_admin/facturacion/page.tsx`

- Vista de facturación propia en español
- Estadísticas de uso con barras de progreso
- Beneficios del plan actual
- Historial de facturas
- Botones de upgrade y método de pago

### 5. APIs Backend

#### Sysadmin APIs:
- `/api/admin/accounts` - GET/POST para gestión de cuentas
- `/api/admin/accounts/[id]` - PUT/DELETE para operaciones específicas
- `/api/admin/accounts/[id]/usage` - GET para estadísticas de uso

#### Account Admin APIs:
- `/api/account/billing` - GET/PUT para datos de facturación
- `/api/account/invoices` - GET para historial de facturas

## Planes Disponibles

### Básico ($0/mes)
- 3 usuarios
- 100 alertas
- 2 integraciones
- 1000 llamadas API/mes
- Soporte por email

### Profesional ($29/mes)
- 10 usuarios
- 1000 alertas
- 10 integraciones
- 10000 llamadas API/mes
- Soporte prioritario
- Branding personalizado
- Análisis avanzados
- Webhooks

### Empresarial (Personalizado)
- Usuarios ilimitados
- Alertas ilimitadas
- Integraciones ilimitadas
- Llamadas API ilimitadas
- Soporte 24/7
- Account manager dedicado

## Seguridad

### Encriptación
- Datos de pago encriptados con AES-256-GCM
- Separación de datos sensibles vs públicos
- Máscara automática para logging

### Permisos
- Solo sysadmin puede ver todas las cuentas
- Account admin solo ve su propia información
- Validación de roles en cada endpoint

## Pasos para Implementar

### 1. Ejecutar SQL
```sql
-- Copiar y ejecutar el contenido de:
-- /sql/update_accounts_table.sql
```

### 2. Configurar Variables de Entorno
```env
MASTER_ENCRYPTION_KEY=64_caracteres_hexadecimales_aqui
```

### 3. Actualizar Navegación
Agregar enlaces en el sidebar:
- Sysadmin: `/dashboard/sysadmin/billing`
- Account Admin: `/dashboard/account_admin/facturacion`

### 4. Probar Funcionalidades
- Crear cuentas como sysadmin
- Ver facturación como account admin
- Probar cambios de plan
- Verificar encriptación de datos

## Características Técnicas

### UI/UX
- Diseño responsive en español
- Barras de progreso para límites
- Colores según estado (verde/amarillo/rojo)
- Modales para acciones importantes

### Validaciones
- Límites de plan en tiempo real
- Detección de接近 a límites (70%, 90%)
- Estados de cuenta automáticos
- Fechas de vencimiento

### Integraciones
- Compatible con Stripe, Mercado Pago, PayPal
- Soporte para múltiples métodos de pago
- Tracking de suscripciones
- Generación automática de facturas

## Notas Importantes

1. **Datos Sensibles**: Nunca se almacenan en texto plano
2. **Permisos**: Validados en cada request
3. **Auditoría**: Todos los cambios quedan registrados
4. **Escalabilidad**: Diseñado para múltiples cuentas
5. **Cumplimiento**: Estructura para cumplir con normativas locales

## Próximos Pasos

1. Integrar con pasarelas de pago reales
2. Implementar generación automática de facturas
3. Agregar notificaciones de vencimiento
4. Crear dashboard de métricas para sysadmin
5. Implementar sistema de upgrades automáticos
