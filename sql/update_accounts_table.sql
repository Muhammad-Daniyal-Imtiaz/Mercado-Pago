-- SQL para actualizar la tabla accounts con campos de facturación y billing
-- Ejecutar en Supabase SQL Editor

-- Primero, verificar si la tabla accounts existe y su estructura actual
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'accounts' 
ORDER BY ordinal_position;

-- Añadir campos de facturación a la tabla accounts
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'basic' CHECK (plan_type IN ('basic', 'professional', 'enterprise')),
ADD COLUMN IF NOT EXISTS billing_status VARCHAR(20) DEFAULT 'trial' CHECK (billing_status IN ('active', 'trial', 'suspended', 'cancelled')),
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) DEFAULT 'manual' CHECK (payment_method IN ('manual', 'credit_card', 'debit_card', 'bank_transfer', 'mercado_pago')),
ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(30) DEFAULT 'none' CHECK (payment_gateway IN ('none', 'stripe', 'mercado_pago', 'paypal')),
ADD COLUMN IF NOT EXISTS card_last_four VARCHAR(4),
ADD COLUMN IF NOT EXISTS card_brand VARCHAR(20),
ADD COLUMN IF NOT EXISTS card_expires_at DATE,
ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS billing_address JSONB,
ADD COLUMN IF NOT EXISTS billing_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50), -- CUIT/CUIL para Argentina
ADD COLUMN IF NOT EXISTS invoice_prefix VARCHAR(10) DEFAULT 'INV',
ADD COLUMN IF NOT EXISTS payment_due_day INTEGER DEFAULT 1 CHECK (payment_due_day >= 1 AND payment_due_day <= 31),
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS current_balance DECIMAL(10,2) DEFAULT 0.00, -- Saldo a favor (positivo) o deuda (negativo)
ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_payment_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS next_billing_date DATE,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255), -- ID del subscription en payment gateway
ADD COLUMN IF NOT EXISTS customer_id VARCHAR(255), -- ID del customer en payment gateway
ADD COLUMN IF NOT EXISTS encrypted_payment_data JSONB, -- Datos sensibles encriptados
ADD COLUMN IF NOT EXISTS usage_stats JSONB DEFAULT '{}', -- Estadísticas de uso
ADD COLUMN IF NOT EXISTS plan_limits JSONB DEFAULT '{}', -- Límites del plan actual
ADD COLUMN IF NOT EXISTS billing_metadata JSONB DEFAULT '{}', -- Metadatos adicionales
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
-- Agregar columna account_admin_id si no existe
ADD COLUMN IF NOT EXISTS account_admin_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Agregar constraint UNIQUE para account_admin_id (solo si la columna existe y no hay datos)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'accounts' 
        AND column_name = 'account_admin_id'
    ) THEN
        -- Solo agregar el constraint si no hay datos existentes o si los datos son válidos
        ALTER TABLE accounts 
        ADD CONSTRAINT unique_account_admin UNIQUE (account_admin_id);
    END IF;
END $$;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_accounts_plan_type ON accounts(plan_type);
CREATE INDEX IF NOT EXISTS idx_accounts_billing_status ON accounts(billing_status);
CREATE INDEX IF NOT EXISTS idx_accounts_payment_method ON accounts(payment_method);
CREATE INDEX IF NOT EXISTS idx_accounts_next_billing_date ON accounts(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_accounts_account_admin_id ON accounts(account_admin_id);

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger solo si no existe
DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at 
    BEFORE UPDATE ON accounts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Crear tabla de límites de planes
CREATE TABLE IF NOT EXISTS plan_limits (
    plan_type VARCHAR(50) PRIMARY KEY,
    limits JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar datos de planes por defecto si no existen
INSERT INTO plan_limits (plan_type, limits) VALUES 
('basic', '{
    "max_users": 3,
    "max_alerts": 100,
    "max_integrations": 2,
    "max_invitations": 5,
    "api_calls_per_month": 1000,
    "support_level": "email",
    "custom_branding": false,
    "advanced_analytics": false,
    "webhooks": false
}'),
('professional', '{
    "max_users": 10,
    "max_alerts": 1000,
    "max_integrations": 10,
    "max_invitations": 20,
    "api_calls_per_month": 10000,
    "support_level": "priority",
    "custom_branding": true,
    "advanced_analytics": true,
    "webhooks": true,
    "sla_guarantee": true
}'),
('enterprise', '{
    "max_users": -1,
    "max_alerts": -1,
    "max_integrations": -1,
    "max_invitations": -1,
    "api_calls_per_month": -1,
    "support_level": "24/7",
    "custom_branding": true,
    "advanced_analytics": true,
    "webhooks": true,
    "sla_guarantee": true,
    "dedicated_account_manager": true,
    "custom_integrations": true
}')
ON CONFLICT (plan_type) DO NOTHING;

-- Crear tabla de facturas
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    paid_date TIMESTAMP WITH TIME ZONE,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ARS',
    items JSONB NOT NULL DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para invoices
CREATE INDEX IF NOT EXISTS idx_invoices_account_id ON invoices(account_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- Trigger para updated_at en invoices
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Crear tabla de pagos
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ARS',
    payment_method VARCHAR(30) NOT NULL,
    payment_gateway VARCHAR(30) NOT NULL,
    transaction_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para payments
CREATE INDEX IF NOT EXISTS idx_payments_account_id ON payments(account_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Trigger para updated_at en payments
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Crear tabla de suscripciones (para tracking de cambios de plan)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'trial', 'cancelled', 'expired')),
    starts_at DATE NOT NULL,
    ends_at DATE,
    cancelled_at DATE,
    billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ARS',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_account_id ON subscriptions(account_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Trigger para updated_at en subscriptions
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON subscriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
