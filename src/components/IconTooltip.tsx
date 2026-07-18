import type { ReactNode } from 'react'
import { useChatStore } from '../store/chatStore'

interface IconTooltipProps {
  label: string
  children: ReactNode
  side?: 'top' | 'bottom'
}

export function IconTooltip({ label, children, side = 'top' }: IconTooltipProps) {
  const tooltipPosition = side === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'
  const theme = useChatStore((state) => state.theme)
  const isDark = theme === 'dark'

  return (
    <div className="group/tooltip relative inline-flex">
      <span aria-label={label}>{children}</span>
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium opacity-0 shadow-lg transition duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 ${isDark ? 'bg-zinc-950 text-white ring-1 ring-zinc-800' : 'bg-white text-zinc-900 ring-1 ring-zinc-200'} ${tooltipPosition}`}
      >
        {label}
      </span>
    </div>
  )
}