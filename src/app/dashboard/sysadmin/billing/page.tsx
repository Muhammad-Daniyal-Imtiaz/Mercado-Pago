'use client'

import { useState, useEffect } from 'react'
import { createAdminClient } from '@/utils/supabase/admin'
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
  created_at: string
  updated_at: string
  encrypted_payment_data?: any
}

interface UsageStats {
  max_users: number
  current_users: number
  max_alerts: number
  current_alerts: number
  api_calls_per_month: number
  current_api_calls: number
}

export default function BillingAdmin() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [usageStats, setUsageStats] = useState<{ [key: string]: UsageStats }>({})

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/admin/accounts')
      const data = await response.json()
      if (data.accounts) {
        setAccounts(data.accounts)
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsageStats = async (accountId: string) => {
    try {
      const response = await fetch(`/api/admin/accounts/${accountId}/usage`)
      const data = await response.json()
      if (data.stats) {
        setUsageStats(prev => ({ ...prev, [accountId]: data.stats }))
      }
    } catch (error) {
      console.error('Error fetching usage stats:', error)
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  const handleUpdateAccount = async (accountId: string, updates: Partial<Account>) => {
    try {
      const response = await fetch(`/api/admin/accounts/${accountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (response.ok) {
        fetchAccounts()
        setEditingAccount(null)
      }
    } catch (error) {
      console.error('Error updating account:', error)
    }
  }

  const handleSuspendAccount = async (accountId: string) => {
    if (confirm('¿Estás seguro de que quieres suspender esta cuenta?')) {
      await handleUpdateAccount(accountId, { billing_status: 'suspended' })
    }
  }

  const handleActivateAccount = async (accountId: string) => {
    await handleUpdateAccount(accountId, { billing_status: 'active' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Cuentas</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Administra todas las cuentas de clientes y su estado de facturación
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAccounts}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Cuentas</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{accounts.length}</div>
        </div>
        <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Activas</div>
          <div className="text-2xl font-bold text-green-600">
            {accounts.filter(a => a.billing_status === 'active').length}
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">En Prueba</div>
          <div className="text-2xl font-bold text-blue-600">
            {accounts.filter(a => a.billing_status === 'trial').length}
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Suspendidas</div>
          <div className="text-2xl font-bold text-red-600">
            {accounts.filter(a => a.billing_status === 'suspended').length}
          </div>
        </div>
      </div>

      {/* Tabla de cuentas */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Método de Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Saldo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Último Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {accounts.map((account) => (
                <tr key={account.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {account.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {account.slug}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlanColor(account.plan_type)}`}>
                      {account.plan_type.charAt(0).toUpperCase() + account.plan_type.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(account.billing_status)}`}>
                      {account.billing_status === 'active' ? 'Activa' : 
                       account.billing_status === 'trial' ? 'Prueba' :
                       account.billing_status === 'suspended' ? 'Suspendida' : 'Cancelada'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {account.payment_method === 'credit_card' ? 'Tarjeta de Crédito' :
                     account.payment_method === 'debit_card' ? 'Tarjeta de Débito' :
                     account.payment_method === 'bank_transfer' ? 'Transferencia Bancaria' :
                     account.payment_method === 'mercado_pago' ? 'Mercado Pago' : 'Manual'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      account.current_balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(Math.abs(account.current_balance))}
                      {account.current_balance >= 0 ? ' a favor' : ' deuda'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {account.last_payment_at ? (
                      <div>
                        <div>{new Date(account.last_payment_at).toLocaleDateString('es-AR')}</div>
                        {account.last_payment_amount && (
                          <div className="text-xs">{formatCurrency(account.last_payment_amount)}</div>
                        )}
                      </div>
                    ) : (
                      'Sin pagos'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedAccount(account)
                          fetchUsageStats(account.id)
                        }}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Ver Detalles
                      </button>
                      {account.billing_status === 'active' ? (
                        <button
                          onClick={() => handleSuspendAccount(account.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Suspender
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivateAccount(account.id)}
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                        >
                          Activar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de detalles */}
      {selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedAccount.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedAccount.slug}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAccount(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Estadísticas de uso */}
              {usageStats[selectedAccount.id] && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Estadísticas de Uso
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Usuarios</div>
                      <div className="text-lg font-medium text-gray-900 dark:text-white">
                        {usageStats[selectedAccount.id].current_users} / {
                          usageStats[selectedAccount.id].max_users === -1 ? '∞' : 
                          usageStats[selectedAccount.id].max_users
                        }
                      </div>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Alertas</div>
                      <div className="text-lg font-medium text-gray-900 dark:text-white">
                        {usageStats[selectedAccount.id].current_alerts} / {
                          usageStats[selectedAccount.id].max_alerts === -1 ? '∞' : 
                          usageStats[selectedAccount.id].max_alerts
                        }
                      </div>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Llamadas API</div>
                      <div className="text-lg font-medium text-gray-900 dark:text-white">
                        {usageStats[selectedAccount.id].current_api_calls} / {
                          usageStats[selectedAccount.id].api_calls_per_month === -1 ? '∞' : 
                          usageStats[selectedAccount.id].api_calls_per_month
                        }
                      </div>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Próximo Vencimiento</div>
                      <div className="text-lg font-medium text-gray-900 dark:text-white">
                        {selectedAccount.next_billing_date ? 
                          new Date(selectedAccount.next_billing_date).toLocaleDateString('es-AR') : 
                          'No definido'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Información de facturación */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Información de Facturación
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Plan Actual
                      </label>
                      <select
                        value={editingAccount?.plan_type || selectedAccount.plan_type}
                        onChange={(e) => setEditingAccount({...selectedAccount, plan_type: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-zinc-700 dark:text-white"
                        disabled={!editingAccount}
                      >
                        <option value="basic">Básico</option>
                        <option value="professional">Profesional</option>
                        <option value="enterprise">Empresarial</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Método de Pago
                      </label>
                      <select
                        value={editingAccount?.payment_method || selectedAccount.payment_method}
                        onChange={(e) => setEditingAccount({...selectedAccount, payment_method: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-zinc-700 dark:text-white"
                        disabled={!editingAccount}
                      >
                        <option value="manual">Manual</option>
                        <option value="credit_card">Tarjeta de Crédito</option>
                        <option value="debit_card">Tarjeta de Débito</option>
                        <option value="bank_transfer">Transferencia Bancaria</option>
                        <option value="mercado_pago">Mercado Pago</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    {editingAccount ? (
                      <>
                        <button
                          onClick={() => setEditingAccount(null)}
                          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleUpdateAccount(selectedAccount.id, editingAccount)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Guardar Cambios
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setEditingAccount(selectedAccount)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Editar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
