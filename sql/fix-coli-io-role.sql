-- CORRECCIÓN INMEDIATA PARA COLI_IO
-- Ejecutar en Supabase SQL Editor

-- 1. Forzar la sincronización manual de roles para coli_io
SELECT sync_user_roles('3865a332-22be-4f39-9350-15d955a614e2'::uuid);

-- 2. Verificar que se corrigió
SELECT id, email, roles, updated_at FROM users WHERE email = 'coli_io@yahoo.com.ar';

-- 3. Si el paso 1 no funciona, actualizar manualmente el rol global
UPDATE users 
SET roles = jsonb_set(
  roles,
  '{0,role}',
  '"account_admin"'
)
WHERE email = 'coli_io@yahoo.com.ar';

-- 4. Verificación final
SELECT id, email, roles, updated_at FROM users WHERE email = 'coli_io@yahoo.com.ar';
