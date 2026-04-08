import { roleGuards } from '@/lib/role-guards'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const health = await roleGuards.getSystemHealth()
    
    return NextResponse.json({
      status: health.status,
      timestamp: new Date().toISOString(),
      ...health.details
    })
  } catch (error) {
    console.error('[ROLE_HEALTH] Error:', error)
    return NextResponse.json({
      status: 'critical',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
