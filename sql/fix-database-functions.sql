-- CORREGIR FUNCIONES PROBLEMÁTICAS EN LA BASE DE DATOS
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar la función get_user_role problemática
DROP FUNCTION IF EXISTS get_user_role(uuid);

-- 2. Crear una versión correcta si es necesaria
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

-- 3. Verificar que la función funciona correctamente
SELECT get_user_role('3865a332-22be-4f39-9350-15d955a614e2'::uuid) as current_role;

-- 4. También crear una función para obtener todos los roles si es necesaria
CREATE OR REPLACE FUNCTION get_user_all_roles(user_id UUID)
RETURNS JSONB AS $$
BEGIN
    RETURN COALESCE(
        (SELECT roles FROM users WHERE id = user_id),
        '[]'::jsonb
    );
END;
$$ LANGUAGE plpgsql;

-- 5. Verificar todos los roles
SELECT get_user_all_roles('3865a332-22be-4f39-9350-15d955a614e2'::uuid) as all_roles;
