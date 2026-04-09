-- CORRECCIÓN INMEDIATA - Ejecutar ahora

-- Paso 1: Actualizar manualmente el rol de coli_io a account_admin
UPDATE users 
SET roles = '[{"role":"account_admin","status":"active","is_primary":true,"organization_id":null}]'
WHERE email = 'coli_io@yahoo.com.ar';

-- Paso 2: Verificar la corrección
SELECT id, email, roles, updated_at FROM users WHERE email = 'coli_io@yahoo.com.ar';
