-- SOLUCIÓN COMPLETA - Ejecutar en orden

-- PASO 1: Corregir el rol actual de coli_io
UPDATE users 
SET roles = '[{"role":"account_admin","status":"active","is_primary":true,"organization_id":null}]'
WHERE email = 'coli_io@yahoo.com.ar';

-- PASO 2: Eliminar la función problemática
DROP FUNCTION IF EXISTS get_user_role(uuid);

-- PASO 3: Verificar que el rol está corregido
SELECT id, email, roles, updated_at FROM users WHERE email = 'coli_io@yahoo.com.ar';

-- PASO 4: Verificar que las organizaciones tienen el rol correcto
SELECT id, name, members FROM organizations WHERE members::text ILIKE '%coli_io@yahoo.com.ar%';

-- PASO 5: Verificar que no hay invitaciones pendientes
SELECT id, email, role, token FROM invitations WHERE email = 'coli_io@yahoo.com.ar';
