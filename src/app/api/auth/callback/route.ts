import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const role = searchParams.get('role') || 'account_user'
  
  // if "next" is in search params, use it as the redirection URL internal
  let next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && user) {
      const admin = createAdminClient()
      
      // Check if user has a pending invitation
      const { data: pendingInvite } = await admin.from('invitations').select('*').eq('email', user.email).single()
      const { data: existingProfile } = await admin.from('users').select('*').eq('id', user.id).single()

      if (pendingInvite && (!existingProfile || !existingProfile.role || existingProfile.role === 'account_user')) {
        // Redirection to the UNIFIED verification screen for invited users
        return NextResponse.redirect(`${origin}/verify-email?email=${user.email}&provider=google`)
      }


      // Normal path: Force role update based on what they selected in the UI modal
      await admin
        .from('users')
        .upsert({ 
          id: user.id, 
          email: user.email, 
          role: role,
          full_name: user.user_metadata?.full_name || user.email
        }, { onConflict: 'id' })

      if (next === '/dashboard') {
        next = `/dashboard/${role}`
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }

  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
