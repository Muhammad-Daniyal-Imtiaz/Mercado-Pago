-- SOLUCIÓN DEFINITIVA PARA PRODUCCIÓN - Versión Limpia
-- Este archivo está listo para producción sin datos sensibles

-- PASO 1: Identificar políticas que usan get_user_role
SELECT 
    schemaname,
    tablename,
    policyname,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE qual ILIKE '%get_user_role%' 
   OR with_check ILIKE '%get_user_role%';

-- PASO 2: Crear función mejorada para get_user_role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_roles JSONB;
    primary_role JSONB;
BEGIN
    -- Obtener los roles del usuario
    SELECT roles INTO user_roles
    FROM users 
    WHERE id = user_id;
    
    -- Si no tiene roles, retornar null
    IF user_roles IS NULL OR jsonb_typeof(user_roles) != 'array' THEN
        RETURN NULL;
    END IF;
    
    -- Buscar el rol primario (is_primary = true)
    SELECT element INTO primary_role
    FROM jsonb_array_elements(user_roles) element
    WHERE element->>'is_primary' = 'true'
    LIMIT 1;
    
    -- Si no hay rol primario, tomar el primer rol
    IF primary_role IS NULL THEN
        SELECT element INTO primary_role
        FROM jsonb_array_elements(user_roles) element
        LIMIT 1;
    END IF;
    
    -- Retornar el nombre del rol
    RETURN primary_role->>'role';
END;
$$ LANGUAGE plpgsql;

-- PASO 3: Corregir masivamente todos los roles inconsistentes
DO $$
DECLARE
    user_record RECORD;
    org_roles JSONB;
    corrected_roles JSONB;
    global_role TEXT;
BEGIN
    -- Iterar sobre todos los usuarios que tienen roles
    FOR user_record IN 
        SELECT id, email, roles FROM users 
        WHERE roles IS NOT NULL 
          AND roles != '[]'::jsonb
    LOOP
        -- Obtener roles de las organizaciones del usuario
        SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
                'role', m->>'role',
                'status', COALESCE(m->>'status', 'active'),
                'is_primary', COALESCE(m->>'is_primary', 'false')::boolean,
                'organization_id', o.id
            )
        ) FILTER (WHERE m->>'id' = user_record.id::text AND m->>'status' != 'removed')
        INTO org_roles
        FROM organizations o
        CROSS JOIN jsonb_array_elements(o.members) m
        WHERE m->>'id' = user_record.id::text
          AND m->>'status' != 'removed';
        
        -- Si tiene roles en organizaciones, determinar el rol global
        IF org_roles IS NOT NULL AND jsonb_array_length(org_roles) > 0 THEN
            -- Determinar el rol más alto
            IF EXISTS (SELECT 1 FROM jsonb_array_elements(org_roles) r WHERE r->>'role' = 'sysadmin') THEN
                global_role := 'sysadmin';
            ELSIF EXISTS (SELECT 1 FROM jsonb_array_elements(org_roles) r WHERE r->>'role' = 'account_admin') THEN
                global_role := 'account_admin';
            ELSIF EXISTS (SELECT 1 FROM jsonb_array_elements(org_roles) r WHERE r->>'role' = 'account_observer') THEN
                global_role := 'account_observer';
            ELSE
                global_role := 'account_user';
            END IF;
            
            -- Construir el array de roles corregido
            corrected_roles := jsonb_build_array(
                jsonb_build_object(
                    'role', global_role,
                    'status', 'active',
                    'is_primary', true,
                    'organization_id', null
                )
            ) || org_roles;
            
            -- Actualizar los roles del usuario
            UPDATE users 
            SET roles = corrected_roles,
                updated_at = NOW()
            WHERE id = user_record.id;
            
            RAISE NOTICE 'Usuario % corregido: rol global %', user_record.email, global_role;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Corrección masiva completada';
END $$;

-- PASO 4: Verificar cuántos usuarios se corrigieron
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN roles::text LIKE '%account_admin%' THEN 1 END) as account_admins,
    COUNT(CASE WHEN roles::text LIKE '%sysadmin%' THEN 1 END) as sysadmins,
    COUNT(CASE WHEN roles::text LIKE '%account_user%' THEN 1 END) as account_users
FROM users 
WHERE roles IS NOT NULL 
  AND roles != '[]'::jsonb;

-- PASO 5: Verificar consistencia entre tablas
WITH user_roles AS (
    SELECT 
        u.id,
        u.email,
        (roles->0->>'role') as global_role
    FROM users u
    WHERE roles IS NOT NULL
),
org_roles AS (
    SELECT 
        m->>'id' as user_id,
        m->>'role' as org_role
    FROM organizations o
    CROSS JOIN jsonb_array_elements(o.members) m
    WHERE m->>'status' != 'removed'
)
SELECT 
    ur.email,
    ur.global_role,
    orr.org_role,
    CASE 
        WHEN ur.global_role = orr.org_role THEN 'CONSISTENT'
        ELSE 'INCONSISTENT'
    END as status
FROM user_roles ur
JOIN org_roles orr ON ur.id = orr.user_id::uuid
WHERE ur.global_role != orr.org_role;

-- PASO 6: Crear trigger para mantener consistencia automática
CREATE OR REPLACE FUNCTION maintain_role_consistency()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se actualizan los miembros de una organización, sincronizar roles
    IF TG_OP = 'UPDATE' AND OLD.members IS DISTINCT FROM NEW.members THEN
        -- Para cada miembro actualizado, sincronizar sus roles
        PERFORM sync_user_roles(
            (elem->>'id')::uuid
        ) FROM jsonb_array_elements(NEW.members) elem
        WHERE elem->>'id' IS NOT NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASO 7: Aplicar trigger a organizations
DROP TRIGGER IF EXISTS maintain_role_consistency_trigger ON organizations;
CREATE TRIGGER maintain_role_consistency_trigger
    AFTER UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION maintain_role_consistency();

-- PASO 8: Verificación final de consistencia
WITH user_roles AS (
    SELECT 
        u.id,
        u.email,
        (roles->0->>'role') as global_role
    FROM users u
    WHERE roles IS NOT NULL
),
org_roles AS (
    SELECT 
        m->>'id' as user_id,
        m->>'role' as org_role
    FROM organizations o
    CROSS JOIN jsonb_array_elements(o.members) m
    WHERE m->>'status' != 'removed'
)
SELECT 
    COUNT(*) as total_inconsistent_users
FROM user_roles ur
JOIN org_roles orr ON ur.id = orr.user_id::uuid
WHERE ur.global_role != orr.org_role;
