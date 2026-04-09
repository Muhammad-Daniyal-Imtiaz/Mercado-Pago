-- DIAGNÓSTICO SIMPLE - Ejecutar paso a paso en Supabase

-- PASO 1: Ver triggers (copiar y ejecutar esto primero)
SELECT 
    event_object_table as tabla,
    trigger_name as trigger_nombre,
    action_timing as momento,
    action_statement as accion
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND event_object_table IN ('users', 'organizations', 'invitations')
ORDER BY event_object_table;

-- PASO 2: Ver estructura de tablas importantes
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('users', 'organizations', 'invitations')
  AND column_name IN ('roles', 'members', 'updated_at', 'created_at')
ORDER BY table_name, column_name;

-- PASO 3: Ver datos actuales del problema (cambia el email si es necesario)
-- Ejecutar cada consulta por separado

-- 3a: Datos de users
SELECT 'USERS' as fuente, id::text, email, roles, created_at FROM users WHERE email = 'coli_io@yahoo.com.ar';

-- 3b: Datos de organizations
SELECT 'ORGANIZATIONS' as fuente, id::text, name, members, created_at FROM organizations WHERE members::text ILIKE '%coli_io@yahoo.com.ar%';

-- 3c: Datos de invitations
SELECT 'INVITATIONS' as fuente, id::text, email, role, token FROM invitations WHERE email = 'coli_io@yahoo.com.ar';

-- PASO 4: Ver si hay funciones que modifican roles
SELECT 
    proname as funcion,
    prosrc as codigo
FROM pg_proc 
WHERE proname ILIKE '%role%' 
   OR proname ILIKE '%sync%'
   OR proname ILIKE '%update%'
ORDER BY proname;
