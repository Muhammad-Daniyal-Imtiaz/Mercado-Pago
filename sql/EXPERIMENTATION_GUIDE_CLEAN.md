# Guía de Experimentación del Sistema de Roles - Versión Limpia

## Objetivo
Probar el sistema de sincronización automática de roles y verificar que las garantías funcionen correctamente.

## Paso 1: Limpiar Datos Actuales

### Opción A: Script Automático (Recomendado)
```bash
# Ejecutar script para limpiar datos de prueba
# Usar variables de entorno válidas para tu entorno
node scripts/reset-test-data.js
```

### Opción B: Manual en Supabase Dashboard
1. Ve a Supabase Dashboard
2. Selecciona tu proyecto
3. Table Editor > `users`
4. Busca usuarios de prueba y edita el campo `roles` a:
```json
[{"role": "account_user", "status": "active", "is_primary": true, "organization_id": null}]
```

## Paso 2: Verificar Estado Inicial

```bash
# Verificar estado actual
node scripts/check-current-session.js
```

## Paso 3: Experimentar con el Sistema

### Experimento 1: Crear Organización y Asignar Rol

1. **Inicia la aplicación:** `npm run dev`
2. **Regístrate como nuevo usuario** (o usa cuenta existente)
3. **Crea una nueva organización**
4. **Verifica que te muestre como `sysadmin` automáticamente**

**Qué debería pasar:**
- La interfaz debe mostrarte como `sysadmin`
- Los logs deben mostrar: `[ROLE_SYNC] Roles sincronizados exitosamente`

### Experimento 2: Simular Inconsistencia

1. **Manualmente crea inconsistencia** en Supabase:
```sql
-- En Supabase SQL Editor
UPDATE users 
SET roles = '[{"role": "account_user", "status": "active", "is_primary": true, "organization_id": null}]'
WHERE email = 'test-user@example.com';
```

2. **Verifica la detección automática:**
   - Refresca la página
   - Deberías ver logs: `[ROLE_SYNC] Inconsistent roles detected... syncing...`
   - La interfaz debe corregirse automáticamente

### Experimento 3: Probar Sistema de Invitaciones

1. **Invita a otro email** a tu organización
2. **Acepta la invitación** con otro navegador
3. **Verifica que los roles se sincronicen** automáticamente

### Experimento 4: Probar Health Check

```bash
# Verificar salud del sistema
curl http://localhost:3000/api/admin/health/roles
```

Debería retornar:
```json
{
  "status": "healthy",
  "totalUsers": 1,
  "consistentUsers": 1,
  "inconsistentUsers": 0,
  "monitoringActive": false
}
```

## Paso 4: Probar Recuperación Manual

### Forzar Sincronización
```bash
# Endpoint manual de sincronización
curl -X POST http://localhost:3000/api/auth/sync-roles \
  -H "Content-Type: application/json" \
  -c cookies.txt
```

### Cambiar Rol Manualmente
```bash
# Script para cambiar rol de prueba
node scripts/change-test-user-role.js
```

## Paso 5: Verificar Garantías

### 1. Zero Impact
- **Acción:** Crea inconsistencia manualmente
- **Verificación:** La interfaz nunca debe mostrar rol incorrecto

### 2. Auto-corrección
- **Acción:** Modifica roles directamente en base de datos
- **Verificación:** Sistema debe corregir automáticamente

### 3. Monitoreo
- **Acción:** Revisa health checks periódicamente
- **Verificación:** Sistema debe reportar estado correcto

## Comandos Útiles

### Verificar Estado Actual
```bash
node scripts/check-current-session.js
```

### Limpiar Datos
```bash
node scripts/reset-test-data.js
```

### Cambiar Rol
```bash
node scripts/change-test-user-role.js
```

### Health Check
```bash
curl http://localhost:3000/api/admin/health/roles
```

### Forzar Sincronización
```bash
curl -X POST http://localhost:3000/api/auth/sync-roles
```

## Escenarios de Prueba

### Escenario A: Usuario Nuevo
1. Registro nuevo
2. Crear organización
3. Verificar rol sysadmin

### Escenario B: Usuario Existente
1. Limpiar datos
2. Crear organización
3. Verificar sincronización

### Escenario C: Múltiples Organizaciones
1. Crear varias organizaciones
2. Verificar consistencia entre todas
3. Cambiar rol en una organización
4. Verificar actualización

### Escenario D: Recuperación de Error
1. Crear inconsistencia manual
2. Verificar detección automática
3. Verificar corrección automática

## Métricas a Observar

- **Detection Time:** Tiempo para detectar inconsistencia
- **Recovery Time:** Tiempo para corregir
- **Sync Success Rate:** % de sincronizaciones exitosas
- **User Experience:** ¿El usuario ve roles correctos siempre?

## Troubleshooting

### Si los roles no se sincronizan:
1. Revisa logs del servidor
2. Verifica health check
3. Usa endpoint manual de sincronización
4. Verifica que el backend esté sincronizado

### Si la interfaz muestra rol incorrecto:
1. Haz logout/login
2. Limpia cookies del navegador
3. Verifica que el backend esté sincronizado
4. Usa `/api/auth/session` para debug

### Si el health check falla:
1. Revisa conexión a base de datos
2. Verifica que el monitoreo esté activo
3. Revisa logs de errores del sistema

Esta guía permite experimentar completamente con el sistema y verificar que todas las garantías funcionen correctamente.
