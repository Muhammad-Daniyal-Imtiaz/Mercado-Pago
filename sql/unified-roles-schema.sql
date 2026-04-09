-- ESQUEMA UNIFICADO PARA GESTIÓN DE ROLES
-- Esto elimina la duplicación y centraliza todo en un solo lugar

-- 1. Crear tabla centralizada de roles (Source of Truth)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('sysadmin', 'account_admin', 'account_user', 'account_observer')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    is_primary BOOLEAN DEFAULT false,
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Un usuario solo puede tener un rol primario por organización
    UNIQUE(user_id, organization_id, is_primary) WHERE is_primary = true,
    -- Un usuario no puede tener múltiples roles activos en la misma organización
    UNIQUE(user_id, organization_id) WHERE status = 'active'
);

-- 2. Crear índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_org_id ON user_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_status ON user_roles(status);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- 3. Vista para compatibilidad con código existente
CREATE OR REPLACE VIEW user_roles_view AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.is_active,
    u.is_verified,
    u.notification_preferences,
    u.alert_channels,
    u.metadata,
    -- Construir el array de roles como antes
    COALESCE(
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'role', ur.role,
                'status', ur.status,
                'is_primary', ur.is_primary,
                'organization_id', ur.organization_id
            )
        ) FILTER (WHERE ur.role IS NOT NULL),
        '[]'::json
    ) as roles,
    u.created_at,
    u.updated_at
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.status = 'active'
GROUP BY u.id, u.email, u.full_name, u.is_active, u.is_verified, 
         u.notification_preferences, u.alert_channels, u.metadata, 
         u.created_at, u.updated_at;

-- 4. Vista para miembros de organizaciones (reemplaza organizations.members)
CREATE OR REPLACE VIEW organization_members_view AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    o.created_at as organization_created_at,
    JSON_AGG(
        JSON_BUILD_OBJECT(
            'id', u.id,
            'email', u.email,
            'role', ur.role,
            'status', ur.status,
            'is_primary', ur.is_primary,
            'full_name', u.full_name,
            'joined_at', ur.assigned_at
        )
    ) FILTER (WHERE u.id IS NOT NULL) as members
FROM organizations o
LEFT JOIN user_roles ur ON o.id = ur.organization_id AND ur.status = 'active'
LEFT JOIN users u ON ur.user_id = u.id
GROUP BY o.id, o.name, o.created_at;

-- 5. Trigger para mantener updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Aplicar trigger a user_roles
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
CREATE TRIGGER update_user_roles_updated_at 
    BEFORE UPDATE ON user_roles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Función para obtener roles de usuario (reemplaza syncUserRoles)
CREATE OR REPLACE FUNCTION get_user_roles(p_user_id UUID)
RETURNS TABLE(
    role VARCHAR(50),
    status VARCHAR(20),
    is_primary BOOLEAN,
    organization_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ur.role,
        ur.status,
        ur.is_primary,
        ur.organization_id
    FROM user_roles ur
    WHERE ur.user_id = p_user_id
      AND ur.status = 'active'
    ORDER BY 
        CASE WHEN ur.is_primary THEN 0 ELSE 1 END,
        ur.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 8. Función para asignar rol (reemplaza lógica compleja)
CREATE OR REPLACE FUNCTION assign_user_role(
    p_user_id UUID,
    p_organization_id UUID,
    p_role VARCHAR(50),
    p_assigned_by UUID DEFAULT NULL,
    p_is_primary BOOLEAN DEFAULT false
)
RETURNS BOOLEAN AS $$
DECLARE
    v_existing_role_id UUID;
BEGIN
    -- Verificar si ya tiene un rol activo en esta organización
    SELECT id INTO v_existing_role_id
    FROM user_roles 
    WHERE user_id = p_user_id 
      AND organization_id = p_organization_id 
      AND status = 'active';
    
    -- Si ya tiene rol, actualizarlo
    IF v_existing_role_id IS NOT NULL THEN
        UPDATE user_roles 
        SET 
            role = p_role,
            is_primary = p_is_primary,
            assigned_by = p_assigned_by,
            assigned_at = NOW()
        WHERE id = v_existing_role_id;
    ELSE
        -- Insertar nuevo rol
        INSERT INTO user_roles (
            user_id, organization_id, role, assigned_by, is_primary
        ) VALUES (
            p_user_id, p_organization_id, p_role, p_assigned_by, p_is_primary
        );
    END IF;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error assigning role: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 9. Migración de datos existentes
DO $$
DECLARE
    user_record RECORD;
    role_data RECORD;
BEGIN
    -- Migrar desde users.roles
    FOR user_record IN 
        SELECT id, roles FROM users 
        WHERE roles IS NOT NULL 
          AND roles != '[]'::json
    LOOP
        -- Parsear roles JSON y migrar
        FOR role_data IN 
            SELECT 
                value->>'role' as role,
                value->>'status' as status,
                COALESCE(value->>'is_primary', 'false')::boolean as is_primary,
                value->>'organization_id' as organization_id
            FROM json_array_elements(user_record.roles)
        LOOP
            -- Insertar en nueva tabla
            INSERT INTO user_roles (
                user_id, organization_id, role, status, is_primary, assigned_at
            ) VALUES (
                user_record.id,
                CASE WHEN role_data.organization_id = 'null' THEN NULL ELSE role_data.organization_id::UUID END,
                role_data.role,
                COALESCE(role_data.status, 'active'),
                role_data.is_primary,
                NOW()
            ) ON CONFLICT (user_id, organization_id, is_primary) 
               WHERE is_primary = true DO NOTHING;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Migración completada';
END $$;

-- 10. Políticas RLS para la nueva tabla
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Política para que usuarios vean sus propios roles
CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Política para que sysadmins vean todos los roles
CREATE POLICY "Sysadmins can view all roles" ON user_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur2 
            WHERE ur2.user_id = auth.uid() 
              AND ur2.role = 'sysadmin' 
              AND ur2.status = 'active'
        )
    );

-- Política para que account_admins vean roles de su organización
CREATE POLICY "Account admins can view org roles" ON user_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur2 
            WHERE ur2.user_id = auth.uid() 
              AND ur2.role = 'account_admin' 
              AND ur2.status = 'active'
              AND ur2.organization_id = user_roles.organization_id
        )
    );

COMMIT;
