import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (!profile) {
    return NextResponse.json({
      user: {
        id: authUser.id,
        email: authUser.email,
        fullName: authUser.user_metadata?.full_name || authUser.email,
        role: 'account_user'
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
      role: profile.role,
      isVerified: profile.is_verified,
      lastLogin: profile.last_login_at
    }
  })
}
