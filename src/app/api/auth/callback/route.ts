import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const role = searchParams.get('role') || 'account_user'
  
  // More reliable production detection
  const isProduction = process.env.NODE_ENV === 'production' || 
                       process.env.VERCEL_ENV === 'production' ||
                       !origin.includes('localhost')
  
  const baseUrl = isProduction 
    ? 'https://pay-alert.com.ar' 
    : origin
  
  // Debug logging
  console.log('Auth Callback - Origin:', origin)
  console.log('Auth Callback - Is Production:', isProduction)
  console.log('Auth Callback - Base URL:', baseUrl)
  console.log('Auth Callback - NODE_ENV:', process.env.NODE_ENV)
  console.log('Auth Callback - VERCEL_ENV:', process.env.VERCEL_ENV)

  if (code) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && user) {
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
    }
  }

  // Redirect to an error page if authentication failed
  return NextResponse.redirect(`${baseUrl}/login?error=auth_callback_failed`)
}
