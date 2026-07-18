import { useState } from 'react'
import { ArrowLeft, Boxes, Key } from 'lucide-react'
import ModelsSection from '../providers/frontend/ModelsSection'
import ApiKeysSection from '../providers/frontend/ApiKeysSection'
import type { ThemeMode } from '../store/chatStore'

type Tab = 'models' | 'keys'

interface SettingsPanelProps {
  theme: ThemeMode
  onClose: () => void
}

export function SettingsPanel({ theme, onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('models')
  const isDark = theme === 'dark'

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'models', label: 'Models', icon: <Boxes size={18} /> },
    { id: 'keys', label: 'API Keys', icon: <Key size={18} /> },
  ]

  return (
    <div className={`flex h-full flex-col ${isDark ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-900'}`}>
      {/* Header */}
      <div className={`flex items-center gap-3 border-b px-6 py-4 ${isDark ? 'border-zinc-800' : 'border-zinc-300'}`}>
        <button
          onClick={onClose}
          className={`rounded-lg p-2 transition-colors ${isDark ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900'}`}
          aria-label="Back to chat"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold">Settings</h1>
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 border-b px-6 pt-2 ${isDark ? 'border-zinc-800' : 'border-zinc-300'}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? isDark
                  ? 'bg-zinc-900 text-white border-b-2 border-blue-500'
                  : 'bg-white text-zinc-900 border-b-2 border-blue-600'
                : isDark
                  ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                  : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {activeTab === 'models' && (
          <ModelsSection isDark={isDark} />
        )}
        {activeTab === 'keys' && (
          <ApiKeysSection isDark={isDark} />
        )}
      </div>
    </div>
  )
}
