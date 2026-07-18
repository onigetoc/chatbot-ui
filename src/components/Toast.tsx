import { useEffect, useState } from 'react'
import { AlertCircle, X } from 'lucide-react'
import type { ThemeMode } from '../store/chatStore'

interface ToastProps {
  message: string
  type?: 'error' | 'warning' | 'info'
  duration?: number
  onDismiss: () => void
  theme: ThemeMode
}

export function Toast({ message, type = 'error', duration = 5000, onDismiss, theme }: ToastProps) {
  const [visible, setVisible] = useState(true)
  const isDark = theme === 'dark'

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onDismiss])

  const colors = {
    error: isDark
      ? 'border-red-500/30 bg-red-950/90 text-red-200'
      : 'border-red-200 bg-red-50 text-red-800',
    warning: isDark
      ? 'border-amber-500/30 bg-amber-950/90 text-amber-200'
      : 'border-amber-200 bg-amber-50 text-amber-800',
    info: isDark
      ? 'border-blue-500/30 bg-blue-950/90 text-blue-200'
      : 'border-blue-200 bg-blue-50 text-blue-800',
  }

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur ${colors[type]}`}>
        <AlertCircle className="h-4 w-4 shrink-0" />
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={() => { setVisible(false); setTimeout(onDismiss, 300) }}
          className="ml-2 shrink-0 rounded-md p-1 opacity-60 transition hover:opacity-100"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
