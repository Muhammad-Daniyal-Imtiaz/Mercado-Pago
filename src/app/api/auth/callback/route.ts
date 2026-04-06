import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Roles should come from the invitations table or be a safe default for NEW users.
  const role = 'account_user';

  // More reliable production detection
  const isProduction = process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production' ||
    !origin.includes('localhost')

  // If we are on localhost, use the actual request origin.
  // In production, use the configured SITE_URL (pay-alert.com.ar).
  const isLocal = origin.includes('localhost')
  const baseUrl = isLocal ? origin : (process.env.NEXT_PUBLIC_SITE_URL || origin)

  if (code) {
    try {
      const supabase = await createClient()

      const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Auth Callback - Exchange error:', error)
        return NextResponse.redirect(`${baseUrl}/login?error=exchange_failed`)
      }

      if (!user) {
        console.error('Auth Callback - No user returned')
        return NextResponse.redirect(`${baseUrl}/login?error=no_user`)
      }
      const admin = createAdminClient()

      // 1. Check if user has a pending invitation
      const { data: pendingInvite } = await admin.from('invitations').select('*').eq('email', user.email).single()

      // 2. Fetch existing profile
      const { data: existingProfile } = await admin.from('users').select('*').eq('id', user.id).single()

      // 3. Priority: If there is a pending invite, always send them to verify it first
      if (pendingInvite) {
        return NextResponse.redirect(`${baseUrl}/verify-email?email=${user.email}&provider=google`)
      }

      // 4. Handle Existing vs New User
      if (existingProfile && existingProfile.role) {
        // RETURNING USER: Don't overwrite their existing active organization
        // Just redirect to their current active dashboard
        return NextResponse.redirect(`${baseUrl}/dashboard/${existingProfile.role}`)
      } else {
        // NEW USER (or missing role): Create initial profile
        await admin
          .from('users')
          .upsert({
            id: user.id,
            email: user.email,
            role: role,
            full_name: user.user_metadata?.full_name || user.email,
            roles: [{ organization_id: null, role: role }] // Initial empty role list maybe? 
          }, { onConflict: 'id' })

        return NextResponse.redirect(`${baseUrl}/dashboard/${role}`)
      }
    } catch (error) {
      console.error('Auth Callback - Unexpected error:', error)
      return NextResponse.redirect(`${baseUrl}/login?error=unexpected_error`)
    }
  }

  // Redirect to an error page if authentication failed
  return NextResponse.redirect(`${baseUrl}/login?error=auth_callback_failed`)
}
