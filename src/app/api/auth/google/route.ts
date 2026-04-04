import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url)
  const role = searchParams.get('role') || 'account_user';
  
  // More reliable production detection
  const isProduction = process.env.NODE_ENV === 'production' || 
                       process.env.VERCEL_ENV === 'production' ||
                       !origin.includes('localhost')
  
  // Force production URL regardless of origin
  const baseUrl = isProduction 
    ? 'https://www.pay-alert.com.ar'
    : origin
  
  // Debug logging
  console.log('Auth Google - Origin:', origin)
  console.log('Auth Google - Is Production:', isProduction)
  console.log('Auth Google - Base URL:', baseUrl)
  console.log('Auth Google - NODE_ENV:', process.env.NODE_ENV)
  console.log('Auth Google - VERCEL_ENV:', process.env.VERCEL_ENV)
  
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${baseUrl}/api/auth/callback?role=${role}`,
      queryParams: {
        prompt: 'select_account',
        access_type: 'offline',
      },
      // Skip browser redirect to handle it manually
      skipBrowserRedirect: false,
    },
  })




  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.redirect(data.url)
}
