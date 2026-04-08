import { RoleGuards } from '@/lib/role-guards'
import { createAdminClient } from '@/utils/supabase/admin'

// Mock de Supabase y role-sync
jest.mock('@/utils/supabase/admin')
jest.mock('@/lib/role-sync', () => ({
  checkRoleConsistency: jest.fn(),
  syncUserRoles: jest.fn()
}))

const mockAdminClient = createAdminClient as jest.MockedFunction<typeof createAdminClient>
const mockCheckRoleConsistency = require('@/lib/role-sync').checkRoleConsistency as jest.MockedFunction<any>
const mockSyncUserRoles = require('@/lib/role-sync').syncUserRoles as jest.MockedFunction<any>

describe('RoleGuards', () => {
  let roleGuards: RoleGuards
  let mockClient: any

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Setup mock client
    mockClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis()
    }
    mockAdminClient.mockReturnValue(mockClient)
    
    roleGuards = new RoleGuards({
      enableAutoSync: true,
      enableMonitoring: false, // Deshabilitar para tests
      enableAlerts: false
    })
  })

  afterEach(() => {
    roleGuards.stopMonitoring()
  })

  describe('validateUserRoles', () => {
    it('debería validar roles consistentes', async () => {
      mockCheckRoleConsistency.mockResolvedValue(true)

      const result = await roleGuards.validateUserRoles('user-123')
      
      expect(mockCheckRoleConsistency).toHaveBeenCalledWith('user-123')
      expect(result.isConsistent).toBe(true)
      expect(result.wasFixed).toBe(false)
      expect(result.details).toBe('Roles consistentes')
    })

    it('debería sincronizar roles inconsistentes', async () => {
      mockCheckRoleConsistency.mockResolvedValue(false)
      mockSyncUserRoles.mockResolvedValue(true)

      const result = await roleGuards.validateUserRoles('user-123')
      
      expect(mockCheckRoleConsistency).toHaveBeenCalledWith('user-123')
      expect(mockSyncUserRoles).toHaveBeenCalledWith('user-123')
      expect(result.isConsistent).toBe(false)
      expect(result.wasFixed).toBe(true)
      expect(result.details).toBe('Roles sincronizados automáticamente')
    })

    it('debería manejar error de sincronización', async () => {
      mockCheckRoleConsistency.mockResolvedValue(false)
      mockSyncUserRoles.mockResolvedValue(false)

      const result = await roleGuards.validateUserRoles('user-123')
      
      expect(result.isConsistent).toBe(false)
      expect(result.wasFixed).toBe(false)
      expect(result.details).toBe('Error al sincronizar roles')
    })
  })

  describe('validateEndpointAccess', () => {
    it('debería permitir acceso con rol correcto', async () => {
      mockCheckRoleConsistency.mockResolvedValue(true)
      mockSyncUserRoles.mockResolvedValue(true)
      
      // Mock de usuario con rol sysadmin
      mockClient.single.mockResolvedValue({
        data: { 
          roles: JSON.stringify([
            { role: 'sysadmin', organization_id: 'org-1', status: 'active' },
            { role: 'account_user', organization_id: null, status: 'active', is_primary: true }
          ])
        },
        error: null
      })

      const result = await roleGuards.validateEndpointAccess('user-123', 'sysadmin')
      
      expect(result.allowed).toBe(true)
      expect(result.role).toBe('sysadmin')
      expect(result.warnings).toHaveLength(0)
    })

    it('debería denegar acceso con rol insuficiente', async () => {
      mockCheckRoleConsistency.mockResolvedValue(true)
      
      // Mock de usuario con rol account_user
      mockClient.single.mockResolvedValue({
        data: { 
          roles: JSON.stringify([
            { role: 'account_user', organization_id: null, status: 'active', is_primary: true }
          ])
        },
        error: null
      })

      const result = await roleGuards.validateEndpointAccess('user-123', 'sysadmin')
      
      expect(result.allowed).toBe(false)
      expect(result.role).toBe('account_user')
    })

    it('debería manejar usuario no encontrado', async () => {
      mockCheckRoleConsistency.mockResolvedValue(true)
      mockClient.single.mockResolvedValue({
        data: null,
        error: { message: 'User not found' }
      })

      const result = await roleGuards.validateEndpointAccess('user-123', 'sysadmin')
      
      expect(result.allowed).toBe(false)
      expect(result.role).toBe('unknown')
      expect(result.warnings).toContain('Usuario no encontrado')
    })

    it('debería sincronizar si hay inconsistencia', async () => {
      mockCheckRoleConsistency.mockResolvedValue(false)
      mockSyncUserRoles.mockResolvedValue(true)
      
      // Mock de usuario después de sincronización
      mockClient.single.mockResolvedValue({
        data: { 
          roles: JSON.stringify([
            { role: 'sysadmin', organization_id: 'org-1', status: 'active' }
          ])
        },
        error: null
      })

      const result = await roleGuards.validateEndpointAccess('user-123', 'sysadmin')
      
      expect(result.wasSynced).toBe(true)
      expect(result.warnings).toContain('Roles sincronizados automáticamente')
    })
  })

  describe('getSystemHealth', () => {
    it('debería tener la estructura correcta', async () => {
      // Test básico de estructura
      const health = await roleGuards.getSystemHealth()
      
      expect(health).toHaveProperty('status')
      expect(health).toHaveProperty('details')
      expect(health.details).toHaveProperty('totalUsers')
      expect(health.details).toHaveProperty('consistentUsers')
      expect(health.details).toHaveProperty('inconsistentUsers')
      expect(health.details).toHaveProperty('monitoringActive')
      expect(health.details).toHaveProperty('lastCheck')
      
      expect(['healthy', 'warning', 'critical']).toContain(health.status)
      expect(typeof health.details.totalUsers).toBe('number')
      expect(typeof health.details.consistentUsers).toBe('number')
      expect(typeof health.details.inconsistentUsers).toBe('number')
      expect(typeof health.details.monitoringActive).toBe('boolean')
    })

    it('debería manejar errores de base de datos', async () => {
      // Forzar error en la llamada a la base de datos
      mockClient.from.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const health = await roleGuards.getSystemHealth()
      
      expect(health.status).toBe('critical')
      expect(health.details.totalUsers).toBe(0)
    })

    it('debería manejar caso sin usuarios', async () => {
      // Mock para caso sin usuarios
      mockClient.from.mockReturnValue(mockClient)
      mockClient.select.mockReturnValue(mockClient)
      mockClient.eq.mockReturnValue(mockClient)
      mockClient.single.mockResolvedValue({
        data: [],
        error: null
      })

      const health = await roleGuards.getSystemHealth()
      
      expect(health.details.totalUsers).toBe(0)
      expect(health.details.consistentUsers).toBe(0)
      expect(health.details.inconsistentUsers).toBe(0)
      expect(health.status).toBe('healthy') // 0 usuarios = healthy
    })
  })

  describe('monitoreo', () => {
    it('debería iniciar y detener monitoreo', () => {
      const guardsWithMonitoring = new RoleGuards({
        enableMonitoring: true,
        enableAutoSync: false,
        enableAlerts: false,
        consistencyCheckInterval: 1 // 1 minuto para tests
      })

      expect(guardsWithMonitoring).toBeDefined()
      
      // Test start monitoring
      const startSpy = jest.spyOn(global, 'setInterval')
      guardsWithMonitoring.startMonitoring()
      expect(startSpy).toHaveBeenCalled()
      
      // Test stop monitoring
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
      guardsWithMonitoring.stopMonitoring()
      expect(clearIntervalSpy).toHaveBeenCalled()
    })
  })

  describe('configuración', () => {
    it('debería usar configuración por defecto', () => {
      const defaultGuards = new RoleGuards()
      
      expect(defaultGuards).toBeDefined()
    })

    it('debería aceptar configuración personalizada', () => {
      const customGuards = new RoleGuards({
        enableAutoSync: false,
        enableMonitoring: false,
        enableAlerts: false,
        consistencyCheckInterval: 60
      })
      
      expect(customGuards).toBeDefined()
    })
  })
})
