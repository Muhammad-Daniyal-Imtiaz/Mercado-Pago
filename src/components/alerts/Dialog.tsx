'use client'

import { useEffect, useCallback, useState } from 'react'
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react'

export interface DialogAction {
  label: string
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  onClick: () => void
  loading?: boolean
  disabled?: boolean
}

export interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirm'
  actions?: DialogAction[]
  closeOnOverlayClick?: boolean
  showCloseButton?: boolean
}

const typeConfig = {
  info: {
    icon: Info,
    iconColor: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/10',
    borderColor: 'border-blue-200 dark:border-blue-900/30',
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/10',
    borderColor: 'border-green-200 dark:border-green-900/30',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/10',
    borderColor: 'border-yellow-200 dark:border-yellow-900/30',
  },
  error: {
    icon: AlertCircle,
    iconColor: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/10',
    borderColor: 'border-red-200 dark:border-red-900/30',
  },
  confirm: {
    icon: AlertTriangle,
    iconColor: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/10',
    borderColor: 'border-red-200 dark:border-red-900/30',
  },
}

const variantStyles = {
  primary: 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100',
  secondary: 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800',
}

export function Dialog({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  actions,
  closeOnOverlayClick = true,
  showCloseButton = true,
}: DialogProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const config = typeConfig[type]
  const Icon = config.icon

  const defaultActions: DialogAction[] = type === 'confirm'
    ? [
        { label: 'Cancelar', variant: 'ghost', onClick: onClose },
        { label: 'Confirmar', variant: 'primary', onClick: onClose },
      ]
    : [{ label: 'Aceptar', variant: 'primary', onClick: onClose }]

  const finalActions = actions || defaultActions

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className={`flex items-center gap-3 p-6 border-b ${config.borderColor} ${config.bgColor}`}>
          <Icon className={`w-6 h-6 ${config.iconColor}`} />
          <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">
            {title}
          </h3>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="ml-auto p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-6 pt-0">
          {finalActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              disabled={action.loading || action.disabled}
              className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[action.variant || 'primary']}`}
            >
              {action.loading ? 'Cargando...' : action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Hook for easy dialog management
export function useDialog() {
  const [dialog, setDialog] = useState<DialogProps>({
    isOpen: false,
    onClose: () => setDialog(prev => ({ ...prev, isOpen: false })),
    title: '',
    message: '',
  })

  const openDialog = useCallback((props: Omit<DialogProps, 'isOpen' | 'onClose'>) => {
    setDialog({
      ...props,
      isOpen: true,
      onClose: () => setDialog(prev => ({ ...prev, isOpen: false })),
    })
  }, [])

  const closeDialog = useCallback(() => {
    setDialog(prev => ({ ...prev, isOpen: false }))
  }, [])

  return { dialog, openDialog, closeDialog }
}
