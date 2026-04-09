-- DIAGNÓSTICO SIMPLE - Versión Limpia para Producción
-- Ejecutar paso a paso en Supabase

-- PASO 1: Ver triggers
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

-- PASO 3: Ver datos actuales de inconsistencias (ejecutar cada consulta por separado)

-- 3a: Usuarios con roles
SELECT 'USERS' as fuente, COUNT(*) as total_users FROM users WHERE roles IS NOT NULL AND roles != '[]'::jsonb;

-- 3b: Organizaciones con miembros
SELECT 'ORGANIZATIONS' as fuente, COUNT(*) as total_orgs FROM organizations WHERE members IS NOT NULL AND jsonb_array_length(members) > 0;

-- 3c: Invitaciones pendientes
SELECT 'INVITATIONS' as fuente, COUNT(*) as pending_invites FROM invitations WHERE token IS NOT NULL;

-- PASO 4: Ver si hay funciones que modifican roles
SELECT 
    proname as funcion,
    prosrc as codigo
FROM pg_proc 
WHERE proname ILIKE '%role%' 
   OR proname ILIKE '%sync%'
   OR proname ILIKE '%update%'
ORDER BY proname;
