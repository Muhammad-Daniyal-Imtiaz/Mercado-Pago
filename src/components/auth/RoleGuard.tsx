import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { UserRole } from '@/types/auth'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  fallbackPath?: string
}

export default async function RoleGuard({
  children,
  allowedRoles,
  fallbackPath = '/dashboard',
}: RoleGuardProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !allowedRoles.includes(profile.role as UserRole)) {
    redirect(fallbackPath)
  }

  return <>{children}</>
}