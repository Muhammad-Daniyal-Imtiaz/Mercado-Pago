import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // 1. Verificar que el usuario está autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Obtener roles del usuario
  const { data: profile } = await adminClient
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
  }

  let userRoles = []
  try {
    userRoles = typeof profile.roles === 'string' ? JSON.parse(profile.roles) : (profile.roles || [])
  } catch {
    userRoles = []
  }

  // 3. Verificar que es account_admin
  const accountAdminRole = userRoles.find((r: { role: string }) => r.role === 'account_admin')
  if (!accountAdminRole) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // 4. Obtener la cuenta asociada
  const { data: account } = await adminClient
    .from('accounts')
    .select('id')
    .eq('account_admin_id', accountAdminRole.organization_id)
    .single()

  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  // 5. Obtener facturas de la cuenta
  const { data: invoices, error: invoicesError } = await adminClient
    .from('invoices')
    .select('*')
    .eq('account_id', account.id)
    .order('issue_date', { ascending: false })
    .limit(12) // Últimas 12 facturas

  if (invoicesError) {
    console.error('Error fetching invoices:', invoicesError)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }

  return NextResponse.json({
    invoices: invoices || []
  })
}
