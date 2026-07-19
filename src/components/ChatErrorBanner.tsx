import { useTranslation } from 'react-i18next'
import { AlertCircle, KeyRound, Gauge, ServerCrash, X } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription, type AlertVariant } from './ui/alert'
import type { ThemeMode } from '../store/chatStore'

export type ChatErrorCode = 'missing_api_key' | 'rate_limit' | 'server_error' | 'auth_error' | 'generic'

export interface ChatErrorInfo {
  code: ChatErrorCode
  message?: string
}

interface Props {
  error: ChatErrorInfo
  theme: ThemeMode
  onDismiss: () => void
  onOpenSettings?: () => void
}

const iconMap: Record<ChatErrorCode, React.ReactNode> = {
  missing_api_key: <KeyRound className="h-4 w-4" />,
  auth_error: <KeyRound className="h-4 w-4" />,
  rate_limit: <Gauge className="h-4 w-4" />,
  server_error: <ServerCrash className="h-4 w-4" />,
  generic: <AlertCircle className="h-4 w-4" />,
}

const variantMap: Record<ChatErrorCode, AlertVariant> = {
  missing_api_key: 'warning',
  auth_error: 'destructive',
  rate_limit: 'warning',
  server_error: 'destructive',
  generic: 'destructive',
}

export function ChatErrorBanner({ error, theme, onDismiss, onOpenSettings }: Props) {
  const { t } = useTranslation()
  const isDark = theme === 'dark'
  const variant = variantMap[error.code]

  const titles: Record<ChatErrorCode, string> = {
    missing_api_key: t('errors.missingApiKeyTitle'),
    auth_error: t('errors.authErrorTitle'),
    rate_limit: t('errors.rateLimitTitle'),
    server_error: t('errors.serverErrorTitle'),
    generic: t('errors.genericTitle'),
  }

  const descriptions: Record<ChatErrorCode, string> = {
    missing_api_key: t('errors.missingApiKeyDesc'),
    auth_error: t('errors.authErrorDesc'),
    rate_limit: t('errors.rateLimitDesc'),
    server_error: t('errors.serverErrorDesc'),
    generic: error.message || t('errors.genericDesc'),
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-2">
      <Alert variant={variant} className={isDark ? 'dark' : ''}>
        {iconMap[error.code]}
        <div className="flex items-start justify-between gap-2">
          <div>
            <AlertTitle>{titles[error.code]}</AlertTitle>
            <AlertDescription>
              {descriptions[error.code]}
              {error.message && error.code !== 'generic' && (
                <p className="mt-1 text-xs opacity-70 font-mono">{error.message}</p>
              )}
            </AlertDescription>
            {(error.code === 'missing_api_key' || error.code === 'auth_error') && onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className={`mt-2 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  isDark
                    ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                    : 'bg-white text-zinc-800 hover:bg-zinc-100 border border-zinc-200'
                }`}
              >
                <KeyRound className="h-3 w-3" />
                {t('errors.openSettings')}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-md p-1 opacity-60 transition hover:opacity-100"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </Alert>
    </div>
  )
}
