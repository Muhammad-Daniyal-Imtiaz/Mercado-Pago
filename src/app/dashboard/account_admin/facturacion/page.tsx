'use client'

import { useState, useEffect } from 'react'
import { encrypt, decrypt, isEncrypted } from '@/lib/crypto'

interface Account {
  id: string
  name: string
  slug: string
  plan_type: string
  billing_status: string
  payment_method: string
  current_balance: number
  last_payment_at?: string
  last_payment_amount?: number
  next_billing_date?: string
  trial_ends_at?: string
  usage_stats: any
  plan_limits: any
  billing_metadata: any
}

interface UsageStats {
  max_users: number
  current_users: number
  max_alerts: number
  current_alerts: number
  api_calls_per_month: number
  current_api_calls: number
}

interface Invoice {
  id: string
  invoice_number: string
  status: string
  issue_date: string
  due_date: string
  total_amount: number
  currency: string
  items: any[]
}

export default function Facturacion() {
  const [account, setAccount] = useState<Account | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)

  useEffect(() => {
    fetchAccountData()
    fetchInvoices()
  }, [])

  const fetchAccountData = async () => {
    try {
      const response = await fetch('/api/account/billing')
      const data = await response.json()
      if (data.account) {
        setAccount(data.account)
        setUsageStats(data.usage)
      }
    } catch (error) {
      console.error('Error fetching account data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/account/invoices')
      const data = await response.json()
      if (data.invoices) {
        setInvoices(data.invoices)
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50'
      case 'trial': return 'text-blue-600 bg-blue-50'
      case 'suspended': return 'text-red-600 bg-red-50'
      case 'cancelled': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'text-gray-600 bg-gray-50'
      case 'professional': return 'text-purple-600 bg-purple-50'
      case 'enterprise': return 'text-orange-600 bg-orange-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-50'
      case 'sent': return 'text-blue-600 bg-blue-50'
      case 'overdue': return 'text-red-600 bg-red-50'
      case 'draft': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  const getUsagePercentage = (current: number, max: number) => {
    if (max === -1) return 0
    return Math.min((current / max) * 100, 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-green-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!account) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-600 dark:text-gray-400">
          No se encontró información de la cuenta
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Facturación</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona tu plan, pagos y facturación
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Método de Pago
          </button>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Actualizar Plan
          </button>
        </div>
      </div>

      {/* Información del plan actual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Plan Actual
              </h2>
              <div className="flex items-center gap-3">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getPlanColor(account.plan_type)}`}>
                  {account.plan_type === 'basic' ? 'Básico' : 
                   account.plan_type === 'professional' ? 'Profesional' : 'Empresarial'}
                </span>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(account.billing_status)}`}>
                  {account.billing_status === 'active' ? 'Activo' : 
                   account.billing_status === 'trial' ? 'En Prueba' :
                   account.billing_status === 'suspended' ? 'Suspendido' : 'Cancelado'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">Próximo vencimiento</div>
              <div className="text-lg font-medium text-gray-900 dark:text-white">
                {account.next_billing_date ? 
                  new Date(account.next_billing_date).toLocaleDateString('es-AR') : 
                  'No definido'
                }
              </div>
            </div>
          </div>

          {/* Estadísticas de uso */}
          {usageStats && (
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                Uso del Plan
              </h3>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Usuarios vinculados</span>
                    <span className={`text-sm font-medium ${getUsageColor(getUsagePercentage(usageStats.current_users, usageStats.max_users))}`}>
                      {usageStats.current_users} de {usageStats.max_users === -1 ? '∞' : usageStats.max_users} disponibles
                    </span>
                  </div>
                  {usageStats.max_users !== -1 && (
                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          getUsagePercentage(usageStats.current_users, usageStats.max_users) >= 90 ? 'bg-red-600' :
                          getUsagePercentage(usageStats.current_users, usageStats.max_users) >= 70 ? 'bg-yellow-600' :
                          'bg-green-600'
                        }`}
                        style={{ width: `${getUsagePercentage(usageStats.current_users, usageStats.max_users)}%` }}
                      ></div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Alertas creadas</span>
                    <span className={`text-sm font-medium ${getUsageColor(getUsagePercentage(usageStats.current_alerts, usageStats.max_alerts))}`}>
                      {usageStats.current_alerts} de {usageStats.max_alerts === -1 ? '∞' : usageStats.max_alerts} disponibles
                    </span>
                  </div>
                  {usageStats.max_alerts !== -1 && (
                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          getUsagePercentage(usageStats.current_alerts, usageStats.max_alerts) >= 90 ? 'bg-red-600' :
                          getUsagePercentage(usageStats.current_alerts, usageStats.max_alerts) >= 70 ? 'bg-yellow-600' :
                          'bg-green-600'
                        }`}
                        style={{ width: `${getUsagePercentage(usageStats.current_alerts, usageStats.max_alerts)}%` }}
                      ></div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Llamadas API este mes</span>
                    <span className={`text-sm font-medium ${getUsageColor(getUsagePercentage(usageStats.current_api_calls, usageStats.api_calls_per_month))}`}>
                      {usageStats.current_api_calls} de {usageStats.api_calls_per_month === -1 ? '∞' : usageStats.api_calls_per_month} disponibles
                    </span>
                  </div>
                  {usageStats.api_calls_per_month !== -1 && (
                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          getUsagePercentage(usageStats.current_api_calls, usageStats.api_calls_per_month) >= 90 ? 'bg-red-600' :
                          getUsagePercentage(usageStats.current_api_calls, usageStats.api_calls_per_month) >= 70 ? 'bg-yellow-600' :
                          'bg-green-600'
                        }`}
                        style={{ width: `${getUsagePercentage(usageStats.current_api_calls, usageStats.api_calls_per_month)}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Beneficios del plan */}
          <div className="mt-6">
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
              Beneficios de tu Plan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {account.plan_limits?.support_level && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Soporte {account.plan_limits.support_level === 'email' ? 'por email' :
                            account.plan_limits.support_level === 'priority' ? 'prioritario' :
                            account.plan_limits.support_level === '24/7' ? '24/7' : 'estándar'}
                  </span>
                </div>
              )}
              {account.plan_limits?.custom_branding && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Branding personalizado</span>
                </div>
              )}
              {account.plan_limits?.advanced_analytics && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Análisis avanzados</span>
                </div>
              )}
              {account.plan_limits?.webhooks && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Webhooks disponibles</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resumen de facturación */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Resumen de Facturación
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Saldo actual</span>
              <span className={`text-sm font-medium ${
                account.current_balance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(Math.abs(account.current_balance))}
                {account.current_balance >= 0 ? ' a favor' : ' deuda'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Método de pago</span>
              <span className="text-sm text-gray-900 dark:text-white">
                {account.payment_method === 'credit_card' ? 'Tarjeta de Crédito' :
                 account.payment_method === 'debit_card' ? 'Tarjeta de Débito' :
                 account.payment_method === 'bank_transfer' ? 'Transferencia' :
                 account.payment_method === 'mercado_pago' ? 'Mercado Pago' : 'Manual'}
              </span>
            </div>
            {account.last_payment_at && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Último pago</span>
                <div className="text-right">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {new Date(account.last_payment_at).toLocaleDateString('es-AR')}
                  </div>
                  {account.last_payment_amount && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatCurrency(account.last_payment_amount)}
                    </div>
                  )}
                </div>
              </div>
            )}
            {account.trial_ends_at && account.billing_status === 'trial' && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Fin del período de prueba</span>
                <span className="text-sm text-blue-600 font-medium">
                  {new Date(account.trial_ends_at).toLocaleDateString('es-AR')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Facturas recientes */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Facturas Recientes
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Vencimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(invoice.issue_date).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(invoice.due_date).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatCurrency(invoice.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getInvoiceStatusColor(invoice.status)}`}>
                        {invoice.status === 'paid' ? 'Pagada' :
                         invoice.status === 'sent' ? 'Enviada' :
                         invoice.status === 'overdue' ? 'Vencida' : 'Borrador'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                        Descargar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No hay facturas registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de método de pago */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Configurar Método de Pago
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Esta funcionalidad estará disponible próximamente. Por ahora, contacta con soporte para configurar tu método de pago.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de upgrade */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Actualizar Plan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className={`border rounded-lg p-4 ${
                account.plan_type === 'basic' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-zinc-200 dark:border-zinc-700'
              }`}>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Básico</h4>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">$24.999/mes</div>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• 3 usuarios</li>
                  <li>• 100 alertas</li>
                  <li>• Soporte por email</li>
                </ul>
              </div>
              <div className={`border rounded-lg p-4 ${
                account.plan_type === 'professional' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-zinc-200 dark:border-zinc-700'
              }`}>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Profesional</h4>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">$49.999/mes</div>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>10 usuarios</li>
                  <li>1000 alertas</li>
                  <li>Soporte prioritario</li>
                  <li>Analytics avanzado</li>
                  <li>Exportación de datos</li>
                </ul>
              </div>
              <div className={`border rounded-lg p-4 ${
                account.plan_type === 'enterprise' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-zinc-200 dark:border-zinc-700'
              }`}>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Empresarial</h4>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Personalizado</div>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>Usuarios ilimitados</li>
                  <li>Notificaciones personalizadas</li>
                  <li>Soporte 24/7</li>
                  <li>Dashboard personalizado</li>
                  <li>Integraciones a medida</li>
                  <li>SLA garantizado</li>
                </ul>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Para actualizar tu plan, por favor contacta con nuestro equipo de ventas.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contactar Ventas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
