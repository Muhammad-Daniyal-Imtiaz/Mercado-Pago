import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

  if (authError || !authUser) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  // Use admin client to ensure we always get the profile role from the users table
  const adminClient = createAdminClient()
  const { data: profile, error: profileError } = await adminClient
    .from('users')
    .select(`
      *,
      account:account_id (
        name,
        slug
      )
    `)
    .eq('id', authUser.id)
    .single()

  if (profileError || !profile) {
    console.error('Profile fetch error:', profileError)
    return NextResponse.json({
      user: {
        id: authUser.id,
        email: authUser.email,
        fullName: authUser.user_metadata?.full_name || authUser.email,
        role: authUser.user_metadata?.role || 'account_user',
        isVerified: false,
        account: null
      }
    })
  }

  return NextResponse.json({
    user: {
      id: profile.id,
      email: profile.email,
      username: profile.username,
      fullName: profile.full_name,
      avatarUrl: profile.avatar_url,
      role: profile.role, // This comes directly from public.users.role
      isVerified: profile.is_verified,
      lastLogin: profile.last_login_at,
      account: profile.account
    }
  })
}
