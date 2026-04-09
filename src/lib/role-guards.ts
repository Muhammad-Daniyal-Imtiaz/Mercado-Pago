import { createAdminClient } from '@/utils/supabase/admin'
import { checkRoleConsistency, syncUserRoles } from './role-sync'

/**
 * Sistema de garantías para roles en producción
 * Proporciona múltiples capas de protección contra inconsistencias
 */

export interface RoleGuardsConfig {
  enableAutoSync: boolean
  enableMonitoring: boolean
  enableAlerts: boolean
  consistencyCheckInterval?: number // minutos
}

export class RoleGuards {
  private config: RoleGuardsConfig
  private monitoringInterval?: NodeJS.Timeout

  constructor(config: RoleGuardsConfig = {
    enableAutoSync: true,
    enableMonitoring: true,
    enableAlerts: true,
    consistencyCheckInterval: 30 // cada 30 minutos
  }) {
    this.config = config
  }

  /**
   * Inicia el monitoreo en segundo plano
   */
  startMonitoring() {
    if (!this.config.enableMonitoring) return

    const intervalMs = (this.config.consistencyCheckInterval || 30) * 60 * 1000
    
    this.monitoringInterval = setInterval(async () => {
      await this.performGlobalConsistencyCheck()
    }, intervalMs)

    console.log(`[ROLE_GUARDS] Monitoreo iniciado cada ${this.config.consistencyCheckInterval} minutos`)
  }

  /**
   * Detiene el monitoreo
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = undefined
      console.log('[ROLE_GUARDS] Monitoreo detenido')
    }
  }

  /**
   * Verificación de consistencia global para todos los usuarios
   */
  private async performGlobalConsistencyCheck() {
    try {
      const adminClient = createAdminClient()
      
      // Obtener todos los usuarios activos
      const { data: users, error } = await adminClient
        .from('users')
        .select('id, email, roles')
        .eq('is_active', true)
      
      if (error) {
        console.error('[ROLE_GUARDS] Error obteniendo usuarios:', error)
        return
      }

      let inconsistentUsers = 0
      let fixedUsers = 0

      for (const user of users || []) {
        const isConsistent = await checkRoleConsistency(user.id)
        
        if (!isConsistent) {
          inconsistentUsers++
          
          if (this.config.enableAutoSync) {
            const synced = await syncUserRoles(user.id)
            if (synced) {
              fixedUsers++
              console.log(`[ROLE_GUARDS] Usuario sincronizado: ${user.email}`)
            } else {
              console.error(`[ROLE_GUARDS] Error sincronizando usuario: ${user.email}`)
            }
          }
        }
      }

      // Reporte de monitoreo
      if (inconsistentUsers > 0) {
        console.log(`[ROLE_GUARDS] Monitoreo: ${inconsistentUsers} usuarios inconsistentes, ${fixedUsers} corregidos`)
        
        if (this.config.enableAlerts && fixedUsers < inconsistentUsers) {
          await this.sendAlert(`CRÍTICO: ${inconsistentUsers - fixedUsers} usuarios con roles inconsistentes sin poder corregir`)
        }
      } else {
        console.log('[ROLE_GUARDS] Monitoreo: Todos los usuarios consistentes')
      }

    } catch (error) {
      console.error('[ROLE_GUARDS] Error en verificación global:', error)
      if (this.config.enableAlerts) {
        await this.sendAlert('ERROR: Falló la verificación global de consistencia de roles')
      }
    }
  }

  /**
   * Validación de consistencia para un usuario específico
   */
  async validateUserRoles(userId: string): Promise<{
    isConsistent: boolean
    wasFixed: boolean
    details: string
  }> {
    const isConsistent = await checkRoleConsistency(userId)
    
    if (!isConsistent && this.config.enableAutoSync) {
      const synced = await syncUserRoles(userId)
      return {
        isConsistent: false,
        wasFixed: synced,
        details: synced ? 'Roles sincronizados automáticamente' : 'Error al sincronizar roles'
      }
    }
    
    return {
      isConsistent,
      wasFixed: false,
      details: isConsistent ? 'Roles consistentes' : 'Roles inconsistentes (auto-sync deshabilitado)'
    }
  }

  /**
   * Middleware para validar roles en endpoints críticos
   */
  async validateEndpointAccess(userId: string, requiredRole?: string): Promise<{
    allowed: boolean
    role: string
    wasSynced: boolean
    warnings: string[]
  }> {
    const warnings: string[] = []
    let wasSynced = false

    // Verificar consistencia
    const validation = await this.validateUserRoles(userId)
    if (!validation.isConsistent) {
      warnings.push(validation.details)
      if (validation.wasFixed) {
        wasSynced = true
      }
    }

    // Obtener rol efectivo
    const adminClient = createAdminClient()
    const { data: user } = await adminClient
      .from('users')
      .select('roles')
      .eq('id', userId)
      .single()

    if (!user) {
      return { allowed: false, role: 'unknown', wasSynced, warnings: ['Usuario no encontrado'] }
    }

    let roles = []
    try {
      roles = typeof user.roles === 'string' ? JSON.parse(user.roles) : (user.roles || [])
    } catch {
      roles = []
    }

    const isSysadmin = roles.some((r: { role: string }) => r.role === 'sysadmin')
    const effectiveRole = isSysadmin ? 'sysadmin' : (roles.find((r: { is_primary?: boolean; role?: string }) => r.is_primary)?.role || 'account_user')

    // Validar rol requerido
    let allowed = true
    if (requiredRole && requiredRole !== 'any') {
      if (requiredRole === 'sysadmin') {
        allowed = isSysadmin
      } else {
        allowed = effectiveRole === requiredRole
      }
    }

    return {
      allowed,
      role: effectiveRole,
      wasSynced,
      warnings
    }
  }

  /**
   * Sistema de alertas (implementación básica)
   */
  private async sendAlert(message: string) {
    console.error(`[ROLE_GUARDS ALERT] ${new Date().toISOString()}: ${message}`)
    
    // Aquí podrías integrar con sistemas de alertas reales:
    // - Slack webhook
    // - Email notifications  
    // - Sentry
    // - Discord webhook
    
    // Por ahora, solo log de error crítico
  }

  /**
   * Reporte de estado del sistema
   */
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical'
    details: {
      totalUsers: number
      consistentUsers: number
      inconsistentUsers: number
      monitoringActive: boolean
      lastCheck?: Date
    }
  }> {
    try {
      const adminClient = createAdminClient()
      
      const { data: users, error } = await adminClient
        .from('users')
        .select('id')
        .eq('is_active', true)
      
      if (error) {
        throw error
      }

      let consistentUsers = 0
      let inconsistentUsers = 0

      for (const user of users || []) {
        const isConsistent = await checkRoleConsistency(user.id)
        if (isConsistent) {
          consistentUsers++
        } else {
          inconsistentUsers++
        }
      }

      const status = inconsistentUsers === 0 ? 'healthy' : 
                   inconsistentUsers <= (users?.length || 0) * 0.05 ? 'warning' : 'critical'

      return {
        status,
        details: {
          totalUsers: users?.length || 0,
          consistentUsers,
          inconsistentUsers,
          monitoringActive: !!this.monitoringInterval,
          lastCheck: new Date()
        }
      }

    } catch (error) {
      console.error('[ROLE_GUARDS] Error en health check:', error)
      return {
        status: 'critical',
        details: {
          totalUsers: 0,
          consistentUsers: 0,
          inconsistentUsers: 0,
          monitoringActive: !!this.monitoringInterval,
          lastCheck: new Date()
        }
      }
    }
  }
}

// Instancia global para producción
export const roleGuards = new RoleGuards({
  enableAutoSync: true,
  enableMonitoring: process.env.NODE_ENV === 'production',
  enableAlerts: process.env.NODE_ENV === 'production',
  consistencyCheckInterval: 30
})
