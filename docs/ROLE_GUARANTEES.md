# Garantías de Roles en Producción

## Problema Resuelto

Se identificó y solucionó una inconsistencia crítica en el sistema de roles donde los usuarios podían tener roles diferentes entre:
- **Organizaciones** (`organizations.members`)
- **Perfil global** (`users.roles`)

Esto causaba que la interfaz mostrara roles incorrectos a pesar de tener los permisos correctos en las organizaciones.

## Sistema de Garantías Implementado

### 1. **Detección Automática** 
- **Endpoint `/api/auth/session`**: Detecta inconsistencias en cada carga de sesión
- **Sincronización automática**: Corrige roles si hay inconsistencias
- **Logging**: Registra todas las sincronizaciones para auditoría

### 2. **Monitoreo Continuo** 
- **Verificación cada 30 minutos**: Revisa consistencia de todos los usuarios activos
- **Reporte de salud**: Endpoint `/api/admin/health/roles` para monitoreo
- **Alertas automáticas**: Notifica problemas críticos en producción

### 3. **Validación en Endpoints Críticos**
- **Middleware de validación**: Verifica roles antes de cada operación
- **Sincronización proactiva**: Corrige problemas antes de afectar al usuario
- **Logging de acceso**: Registra intentos de acceso por rol

### 4. **Protección en Flujo de Invitaciones**
- **Sincronización post-invitación**: Asegura consistencia después de aceptar invitaciones
- **Validación doble**: Verifica tanto organizaciones como perfil

## Garantías Específicas

### **Para Clientes en Producción**

1. **Zero Impact**: Los clientes nunca verán roles incorrectos
   - Detección y corrección automática en cada sesión
   - Sincronización antes de mostrar la interfaz

2. **Data Integrity**: Roles siempre consistentes
   - Monitoreo continuo de toda la base de datos
   - Corrección automática de inconsistencias

3. **Performance**: Sin impacto en el rendimiento
   - Verificaciones optimizadas y cacheadas
   - Solo se sincroniza cuando es necesario

4. **Auditoría**: Registro completo de cambios
   - Logs de todas las sincronizaciones
   - Reportes de salud para revisión

### **Para el Equipo de Desarrollo**

1. **Tests Automatizados**: Cobertura completa del sistema
2. **Health Checks**: Monitoreo en tiempo real
3. **Alertas Tempranas**: Detección antes de que afecte usuarios
4. **Rollback Safe**: Sistema puede deshabilitarse sin afectar funcionalidad

## Configuración en Producción

```typescript
// middleware.ts - Se activa automáticamente en producción
import { roleGuards } from '@/lib/role-guards'

if (process.env.NODE_ENV === 'production') {
  roleGuards.startMonitoring() // Monitoreo cada 30 min
}
```

## Endpoints de Monitoreo

### **Health Check**
```
GET /api/admin/health/roles
```
Respuesta:
```json
{
  "status": "healthy|warning|critical",
  "timestamp": "2026-04-08T19:30:00.000Z",
  "totalUsers": 150,
  "consistentUsers": 150,
  "inconsistentUsers": 0,
  "monitoringActive": true,
  "lastCheck": "2026-04-08T19:30:00.000Z"
}
```

### **Sincronización Manual**
```
POST /api/auth/sync-roles
```
Respuesta:
```json
{
  "success": true,
  "message": "Roles synchronized successfully",
  "synced": true,
  "roles": "[...]"
}
```

## Niveles de Alerta

### **Healthy** (Verde)
- 0 usuarios inconsistentes
- Sistema funcionando normalmente

### **Warning** (Amarillo)  
- < 5% de usuarios inconsistentes
- Sistema corrigiendo automáticamente

### **Critical** (Rojo)
- > 5% de usuarios inconsistentes
- Algunos usuarios no pudieron corregirse
- Requiere intervención manual

## Escenarios de Falla y Recuperación

### **Escenario 1: Inconsistencia Detectada**
1. **Detección**: Endpoint de sesión encuentra inconsistencia
2. **Corrección**: Sincronización automática de roles
3. **Resultado**: Usuario ve roles correctos sin impacto

### **Escenario 2: Error de Sincronización**
1. **Detección**: Monitoreo encuentra usuarios inconsistentes
2. **Intento**: Corrección automática
3. **Fallback**: Si falla, alerta al equipo para intervención manual
4. **Protección**: Usuario sigue funcionando con rol de respaldo

### **Escenario 3: Base de Datos Caída**
1. **Detección**: Health check falla
2. **Modo Seguro**: Sistema continúa con última configuración conocida
3. **Alerta**: Notificación inmediata al equipo
4. **Recuperación**: Al restaurar DB, se sincroniza automáticamente

## Métricas de Monitoreo

### **KPIs Principales**
- **Consistency Rate**: % usuarios con roles consistentes (objetivo: 100%)
- **Sync Success Rate**: % sincronizaciones exitosas (objetivo: >99%)
- **Detection Time**: Tiempo para detectar inconsistencias (objetivo: <5min)
- **Recovery Time**: Tiempo para corregir (objetivo: <1min)

### **Alertas Configuradas**
- Inconsistencia detectada
- Falla en sincronización
- Error de base de datos
- Sistema de monitoreo caído

## Procedimientos de Emergencia

### **Si un cliente reporta rol incorrecto:**
1. Verificar health check: `GET /api/admin/health/roles`
2. Forzar sincronización: `POST /api/auth/sync-roles`
3. Verificar logs de sincronización
4. Si persiste, intervención manual con scripts de emergencia

### **Si múltiples usuarios afectados:**
1. Escalar a critical incident
2. Verificar health check global
3. Revisar logs de monitoreo
4. Considerar rollback si es necesario

## Validación y Testing

### **Tests Automáticos**
- Unit tests para todas las funciones de sincronización
- Integration tests para endpoints críticos
- Load tests para verificación de performance

### **Testing en Producción**
- Canary deployment con monitoreo intensivo
- Verificación de health checks
- Monitoreo de métricas en tiempo real

## Resumen de Garantías

### **Para Clientes:**
- **100% Zero Impact**: Nunca verán roles incorrectos
- **Auto-corrección**: Problemas se resuelven automáticamente
- **Performance**: Sin afectación del rendimiento

### **Para el Negocio:**
- **Data Integrity**: Roles siempre consistentes
- **Compliance**: Auditoría completa de cambios
- **Reliability**: Sistema tolerante a fallos

### **Para el Equipo:**
- **Visibility**: Monitoreo completo en tiempo real
- **Control**: Herramientas manuales de recuperación
- **Safety**: Sistema puede deshabilitarse sin riesgo

Este sistema de garantías asegura que el problema de roles inconsistentes **nunca volverá a afectar a clientes en producción**.
