import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Boxes, Key, Settings2 } from 'lucide-react'
import ModelsSection from '../providers/frontend/ModelsSection'
import ApiKeysSection from '../providers/frontend/ApiKeysSection'
import { GeneralSettings } from './GeneralSettings'
import { useChatStore } from '../store/chatStore'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from './ui/dialog'

type Tab = 'general' | 'models' | 'keys'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsPanel({ open, onOpenChange }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const { t } = useTranslation()
  const theme = useChatStore((state) => state.theme)
  const isDark = theme === 'dark'

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: t('settings.general'), icon: <Settings2 size={18} /> },
    { id: 'models', label: t('settings.models'), icon: <Boxes size={18} /> },
    { id: 'keys', label: t('settings.apiKeys'), icon: <Key size={18} /> },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`flex flex-row max-w-7xl h-[92vh] overflow-hidden ${
          isDark
            ? 'bg-zinc-900 border-zinc-700 text-white'
            : 'bg-white border-zinc-300 text-zinc-900'
        }`}
      >
        {/* Hidden title for accessibility */}
        <DialogTitle className="sr-only">Settings</DialogTitle>

        {/* Left sidebar nav */}
        <nav
          className={`flex w-56 shrink-0 flex-col border-r py-6 px-3 ${
            isDark ? 'border-zinc-700' : 'border-zinc-200'
          }`}
        >
          <span
            className={`mb-3 px-3 text-xs font-semibold uppercase tracking-wider ${
              isDark ? 'text-zinc-500' : 'text-zinc-400'
            }`}
          >
            {t('settings.title')}
          </span>

          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? isDark
                    ? 'bg-zinc-800 text-white'
                    : 'bg-zinc-100 text-zinc-900'
                  : isDark
                    ? 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                    : 'text-zinc-600 hover:bg-zinc-100/70 hover:text-zinc-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Main content area */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {activeTab === 'general' && <GeneralSettings isDark={isDark} />}
          {activeTab === 'models' && <ModelsSection isDark={isDark} />}
          {activeTab === 'keys' && <ApiKeysSection isDark={isDark} />}
        </div>
      </DialogContent>
    </Dialog>
  )
}
