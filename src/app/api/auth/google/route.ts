import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url)
  const role = searchParams.get('role') || 'account_user';

  // More reliable production detection
  const isProduction = process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production' ||
    !origin.includes('localhost')

  // If we are on localhost, use the actual request origin.
  // In production, use the configured SITE_URL (pay-alert.com.ar).
  const isLocal = origin.includes('localhost')
  const baseUrl = isLocal ? origin : (process.env.NEXT_PUBLIC_SITE_URL || origin)

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
