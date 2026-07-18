import { useTranslation } from 'react-i18next'

interface Props {
  isDark: boolean
}

const languages = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
]

export function GeneralSettings({ isDark }: Props) {
  const { t, i18n } = useTranslation()

  function handleLanguageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    i18n.changeLanguage(e.target.value)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
          {t('settings.general')}
        </h2>
      </div>

      {/* Language setting */}
      <div className={`rounded-lg border p-4 ${isDark ? 'border-zinc-700 bg-zinc-800/50' : 'border-zinc-200 bg-zinc-50'}`}>
        <label
          htmlFor="language-select"
          className={`block text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}
        >
          {t('settings.language')}
        </label>
        <p className={`mt-1 text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
          {t('settings.languageDescription')}
        </p>
        <select
          id="language-select"
          value={i18n.language?.substring(0, 2) || 'en'}
          onChange={handleLanguageChange}
          className={`mt-3 w-full max-w-xs rounded-md border px-3 py-2 text-sm outline-none transition-colors ${
            isDark
              ? 'border-zinc-600 bg-zinc-800 text-zinc-100 focus:border-blue-500'
              : 'border-zinc-300 bg-white text-zinc-900 focus:border-blue-500'
          }`}
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
