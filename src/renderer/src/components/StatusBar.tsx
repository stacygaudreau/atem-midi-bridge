import type { ReactNode } from 'react'
import { Music, Video } from 'lucide-react'
import type { AtemConnectionStatus, MidiConnectionStatus } from '@shared/types'
import { Badge } from '@renderer/components/ui/badge'

interface StatusBarProps {
  midiStatus: MidiConnectionStatus
  atemStatus: AtemConnectionStatus
  onNavigateAtem: () => void
  onNavigateMidi: () => void
}

function StatusCard({
  icon,
  title,
  badge,
  subtitle,
  onClick
}: {
  icon: ReactNode
  title: string
  badge: ReactNode
  subtitle: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
        {icon}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          {badge}
        </div>
        <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
      </div>
    </button>
  )
}

export function StatusBar({ midiStatus, atemStatus, onNavigateAtem, onNavigateMidi }: StatusBarProps) {
  const atemSubtitle = atemStatus.connected
    ? [atemStatus.deviceInfo?.model, atemStatus.ip].filter(Boolean).join(' · ')
    : atemStatus.error ?? 'Not connected'

  const midiSubtitle = midiStatus.connected
    ? midiStatus.portName ?? 'Connected'
    : midiStatus.error ?? 'Not connected'

  return (
    <div className="flex items-stretch divide-x divide-border rounded-lg border border-border bg-card">
      <StatusCard
        icon={<Video className="size-4" />}
        title="ATEM"
        subtitle={atemSubtitle}
        onClick={onNavigateAtem}
        badge={
          <Badge variant={atemStatus.connected ? 'success' : atemStatus.connecting ? 'secondary' : 'outline'}>
            {atemStatus.connected ? 'Connected' : atemStatus.connecting ? 'Connecting…' : 'Disconnected'}
          </Badge>
        }
      />

      <StatusCard
        icon={<Music className="size-4" />}
        title="MIDI"
        subtitle={midiSubtitle}
        onClick={onNavigateMidi}
        badge={
          <Badge variant={midiStatus.connected ? 'success' : 'outline'}>
            {midiStatus.connected ? 'Connected' : 'Disconnected'}
          </Badge>
        }
      />
    </div>
  )
}
