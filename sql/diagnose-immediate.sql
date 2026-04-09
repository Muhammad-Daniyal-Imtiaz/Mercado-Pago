-- DIAGNÓSTICO INMEDIATO - Ejecutar ahora en Supabase

-- 1. Ver si hay triggers que modifican users u organizations
SELECT 
    event_object_table as tabla,
    trigger_name as trigger,
    action_timing as momento,
    action_statement as accion
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND event_object_table IN ('users', 'organizations', 'invitations')
ORDER BY event_object_table;

-- 2. Ver datos actuales del problema (cambia el email)
SELECT 
    'USERS TABLE' as fuente,
    id,
    email,
    roles
FROM users 
WHERE email = 'coli_io@yahoo.com.ar' -- CAMBIA ESTE EMAIL

UNION ALL

SELECT 
    'ORGANIZATIONS' as fuente,
    id::text,
    (members->0->>'email') as email, -- Asumiendo primer miembro
    members->0->>'role' as roles
FROM organizations 
WHERE members::text ILIKE '%coli_io@yahoo.com.ar%' -- CAMBIA ESTE EMAIL

UNION ALL

SELECT 
    'INVITATIONS' as fuente,
    id::text,
    email,
    role
FROM invitations 
WHERE email = 'coli_io@yahoo.com.ar' -- CAMBIA ESTE EMAIL
  AND status = 'pending';

-- 3. Ver logs de cambios recientes (si existe tabla de logs)
SELECT 
    table_name,
    operation,
    user_email,
    old_data,
    new_data,
    created_at
FROM audit_log 
WHERE table_name IN ('users', 'organizations')
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;
