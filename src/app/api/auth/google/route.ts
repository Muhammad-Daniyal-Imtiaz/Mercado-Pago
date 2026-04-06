import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  const role = 'account_user'; // Default for new OAuth accounts

  // More reliable production detection
  const isProduction = process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production' ||
    !origin.includes('localhost')

  // If we are on localhost, use the actual request origin.
  // In production, use the configured SITE_URL (pay-alert.com.ar).
  const isLocal = origin.includes('localhost')
  const baseUrl = isLocal ? origin : (process.env.NEXT_PUBLIC_SITE_URL || origin)

  const supabase = await createClient()
  const cookieStore = await cookies()
  cookieStore.set('auth_role', role, { maxAge: 60 * 5, path: '/' }) // 5 min max

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${baseUrl}/api/auth/callback`,
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
