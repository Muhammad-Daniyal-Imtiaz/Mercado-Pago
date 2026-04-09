-- SQL para debug del problema de roles
-- Ejecutar en Supabase SQL Editor para identificar triggers y funciones

-- 1. Ver todos los triggers en la base de datos
SELECT 
    event_object_table,
    trigger_name,
    action_timing,
    action_condition,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 2. Ver todas las funciones que puedan modificar roles
SELECT 
    proname as function_name,
    prosrc as source_code,
    prolang::regproc as language
FROM pg_proc 
WHERE proname LIKE '%role%' 
   OR proname LIKE '%sync%'
   OR proname LIKE '%update%'
   OR prosrc ILIKE '%users%'
   OR prosrc ILIKE '%organizations%'
   OR prosrc ILIKE '%roles%'
ORDER BY proname;

-- 3. Ver políticas RLS que puedan afectar users
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('users', 'organizations', 'invitations')
ORDER BY tablename, policyname;

-- 4. Ver estructura actual de las tablas clave
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('users', 'organizations', 'invitations', 'auth.users')
ORDER BY table_name, ordinal_position;

-- 5. Ver datos actuales para identificar inconsistencias
SELECT 
    'users' as table_name,
    id,
    email,
    roles,
    created_at
FROM users 
WHERE email = 'coli_io@yahoo.com.ar' -- Reemplaza con el email que estás probando

UNION ALL

SELECT 
    'organizations' as table_name,
    id::text,
    'N/A' as email,
    members::text as roles,
    created_at
FROM organizations 
WHERE members::text ILIKE '%coli_io@yahoo.com.ar%';

-- 6. Ver logs de auditoría si existen
SELECT * FROM audit_log 
WHERE table_name IN ('users', 'organizations')
  AND operation = 'UPDATE'
  AND NEW_DATA ILIKE '%roles%'
ORDER BY created_at DESC 
LIMIT 10;

-- 7. Ver si hay jobs o scheduled tasks
SELECT 
    jobname,
    schedule,
    command,
    active
FROM pg_job 
WHERE command ILIKE '%role%' OR command ILIKE '%sync%' OR command ILIKE '%users%';
