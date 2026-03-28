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
      // FORCE persistent role update in the public database to prevent "Account User" default
      const admin = createAdminClient()
      
      // This is the CRITICAL fix: manually forcing the database role to match the choice
      await admin
        .from('users')
        .upsert({ 
          id: user.id, 
          email: user.email, 
          role: role,
          full_name: user.user_metadata?.full_name || user.email
        }, { onConflict: 'id' })

      
      // Overwrite next if we have a specific role dashboard
      if (next === '/dashboard') {
        next = `/dashboard/${role}`
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
