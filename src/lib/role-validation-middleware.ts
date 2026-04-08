import { roleGuards } from './role-guards'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware de validación de roles para endpoints críticos
 * Proporciona garantías adicionales de seguridad y consistencia
 */

export interface RoleValidationOptions {
  requiredRole?: string
  allowSync?: boolean
  logAccess?: boolean
}

export async function validateRoleAccess(
  request: NextRequest,
  options: RoleValidationOptions = {}
): Promise<{
  success: boolean
  response?: NextResponse
  userId?: string
  role?: string
  warnings?: string[]
}> {
  try {
    // Obtener token de sesión
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie')
    
    if (!authHeader && !cookieHeader) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'No authentication provided' },
          { status: 401 }
        )
      }
    }

    // Aquí deberías validar el token y obtener el userId
    // Por ahora, simulamos la validación
    const userId = 'extracted-from-token' // Implementar extracción real

    // Validar acceso y consistencia de roles
    const validation = await roleGuards.validateEndpointAccess(
      userId,
      options.requiredRole
    )

    if (!validation.allowed) {
      return {
        success: false,
        response: NextResponse.json(
          { 
            error: 'Insufficient permissions',
            requiredRole: options.requiredRole,
            currentRole: validation.role
          },
          { status: 403 }
        )
      }
    }

    // Log de acceso si está habilitado
    if (options.logAccess) {
      console.log(`[ROLE_ACCESS] User ${userId} with role ${validation.role} accessed ${request.url}`)
    }

    // Advertencias de sincronización
    if (validation.warnings.length > 0) {
      console.warn(`[ROLE_WARNINGS] User ${userId}: ${validation.warnings.join(', ')}`)
    }

    return {
      success: true,
      userId,
      role: validation.role,
      warnings: validation.warnings
    }

  } catch (error) {
    console.error('[ROLE_VALIDATION] Error:', error)
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Role validation failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * Wrapper para endpoints que requieren validación de roles
 */
export function withRoleValidation(
  handler: (request: NextRequest, context: { userId: string; role: string }) => Promise<NextResponse>,
  options: RoleValidationOptions = {}
) {
  return async (request: NextRequest) => {
    const validation = await validateRoleAccess(request, options)
    
    if (!validation.success) {
      return validation.response!
    }

    // Llamar al handler original con el contexto validado
    return handler(request, {
      userId: validation.userId!,
      role: validation.role!
    })
  }
}

/**
 * Validaciones específicas para diferentes tipos de endpoints
 */

export const requireSysadmin = (handler: (request: NextRequest, context: { userId: string; role: string }) => Promise<NextResponse>) => 
  withRoleValidation(handler, { requiredRole: 'sysadmin', logAccess: true })

export const requireAccountAdmin = (handler: (request: NextRequest, context: { userId: string; role: string }) => Promise<NextResponse>) => 
  withRoleValidation(handler, { requiredRole: 'account_admin', logAccess: true })

export const requireAnyRole = (handler: (request: NextRequest, context: { userId: string; role: string }) => Promise<NextResponse>) => 
  withRoleValidation(handler, { requiredRole: 'any', logAccess: false })
