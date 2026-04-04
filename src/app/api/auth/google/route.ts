import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url)
  const role = searchParams.get('role') || 'account_user';
  
  // Always use the production URL in production, localhost in development
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://pay-alert.com.ar' 
    : origin
  
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${baseUrl}/api/auth/callback?role=${role}`,
      queryParams: {
        prompt: 'select_account',
        access_type: 'offline',
      },
    },
  })




  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.redirect(data.url)
}
