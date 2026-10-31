import { useEffect, useState } from 'react'
import { ArrowUpToLine, Check, ChevronDown, ChevronUp } from 'lucide-react'
import type { AtemAudioChannelInfo, AtemAudioLevel, AtemAudioSourceLevel, AtemConnectionStatus } from '@shared/types'
import { Card, CardHeader, CardTitle, CardContent } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { cn } from '@renderer/lib/utils'

interface AudioSectionProps {
  atemStatus: AtemConnectionStatus
  masterLevel: AtemAudioLevel | null
  sourceLevels: AtemAudioSourceLevel[]
  audioChannels: AtemAudioChannelInfo[]
  onSetChannelGain: (index: number, gainDb: number) => void
  onSelectSoloChannel: (index: number) => void
}

const METER_FLOOR_DB = -60
const METER_CEIL_DB = 0
const TICK_MARKS = [0, -10, -20, -30, -50]
// Zone boundaries match the requested tick marks: green below -20, yellow -20..-10, red above -10.
const YELLOW_AT_DB = -20
const RED_AT_DB = -10

function levelToPercent(db: number | null): number {
  if (db === null || !Number.isFinite(db)) return 0
  const clamped = Math.min(METER_CEIL_DB, Math.max(METER_FLOOR_DB, db))
  return ((clamped - METER_FLOOR_DB) / (METER_CEIL_DB - METER_FLOOR_DB)) * 100
}

function formatDb(db: number | null): string {
  if (db === null || !Number.isFinite(db) || db <= METER_FLOOR_DB) return '-∞'
  return db.toFixed(1)
}

// The highlighted (ON) box uses a light primary background, so the normal -500
// shades (tuned for a dark card background) lose almost all contrast -- swap to
// dark shades for contrast. amber-900 reads as near-indistinguishable from
// red-900 at that darkness, so the yellow zone uses a near-black neutral instead.
function zoneTextColor(db: number | null, highlighted?: boolean): string {
  if (db === null || !Number.isFinite(db)) return highlighted ? 'text-primary-foreground/60' : 'text-muted-foreground'
  if (db >= RED_AT_DB) return highlighted ? 'text-red-900' : 'text-destructive'
  if (db >= YELLOW_AT_DB) return highlighted ? 'text-zinc-900' : 'text-warning'
  return highlighted ? 'text-emerald-900' : 'text-success'
}

const YELLOW_PERCENT = levelToPercent(YELLOW_AT_DB)
const RED_PERCENT = levelToPercent(RED_AT_DB)
const ZONE_STOPS = `var(--success) 0%, var(--success) ${YELLOW_PERCENT}%, var(--warning) ${YELLOW_PERCENT}%, var(--warning) ${RED_PERCENT}%, var(--destructive) ${RED_PERCENT}%, var(--destructive) 100%`
const METER_GRADIENT = `linear-gradient(to top, ${ZONE_STOPS})`

const METER_GRADIENT_HORIZONTAL = `linear-gradient(to right, ${ZONE_STOPS})`

function MeterBar({ percent }: { percent: number }) {
  return (
    <div className="relative h-32 w-3 overflow-hidden rounded-sm" style={{ background: METER_GRADIENT }}>
      <div className="absolute inset-x-0 top-0 bg-secondary" style={{ height: `${100 - percent}%` }} />
    </div>
  )
}

function HorizontalMeterBar({ percent }: { percent: number }) {
  return (
    <div
      className="relative h-2 w-full overflow-hidden rounded-sm"
      style={{ background: METER_GRADIENT_HORIZONTAL }}
    >
      <div className="absolute inset-y-0 right-0 bg-secondary" style={{ width: `${100 - percent}%` }} />
    </div>
  )
}

function HorizontalMasterMeter({
  level,
  peakDb,
  onResetPeak,
  selectedChannelLabel
}: {
  level: AtemAudioLevel | null
  peakDb: number | null
  onResetPeak: () => void
  selectedChannelLabel: string
}) {
  return (
    <div className="flex h-9 flex-1 items-stretch divide-x divide-border">
      <div className="flex flex-col justify-center gap-0.5 px-5">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Source</span>
        <span className="text-sm font-semibold leading-none">{selectedChannelLabel}</span>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-0.5 px-10">
        <HorizontalMeterBar percent={levelToPercent(level?.left ?? null)} />
        <HorizontalMeterBar percent={levelToPercent(level?.right ?? null)} />
      </div>
      <button
        type="button"
        onClick={onResetPeak}
        title="Click to reset peak"
        className={cn(
          'cursor-pointer px-5 text-lg font-bold tabular-nums transition-colors hover:opacity-70',
          zoneTextColor(peakDb)
        )}
      >
        {formatDb(peakDb)}
      </button>
    </div>
  )
}

function ScaleColumn({ highlighted }: { highlighted?: boolean }) {
  return (
    <div className="relative h-32 w-8 shrink-0">
      {TICK_MARKS.map((db) => (
        <div
          key={db}
          className="absolute left-0 flex w-full -translate-y-1/2 items-center gap-1"
          style={{ top: `${100 - levelToPercent(db)}%` }}
        >
          <span className={cn('h-px w-1.5', highlighted ? 'bg-black' : 'bg-border')} />
          <span className={cn('text-[9px]', highlighted ? 'text-black' : 'text-muted-foreground')}>{db}</span>
        </div>
      ))}
    </div>
  )
}

interface GainInputProps {
  gainDb: number
  disabled: boolean
  highlighted?: boolean
  onCommit: (value: number) => void
}

function GainInput({ gainDb, disabled, highlighted, onCommit }: GainInputProps) {
  const [value, setValue] = useState(gainDb.toFixed(2))
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!editing) setValue(gainDb.toFixed(2))
  }, [gainDb, editing])

  function commit(): void {
    setEditing(false)
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed !== gainDb) onCommit(parsed)
    else setValue(gainDb.toFixed(2))
  }

  return (
    <Input
      className={cn('h-7 w-20 text-center text-xs', highlighted && 'border-background bg-background text-foreground')}
      value={value}
      disabled={disabled}
      onFocus={() => setEditing(true)}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
      }}
    />
  )
}

interface MeterGroupProps {
  label: string
  level: AtemAudioLevel | null
  peakDb: number | null
  onResetPeak: () => void
  on?: boolean
  gainDb?: number
  onSetGain?: (value: number) => void
  onSelect?: () => void
}

function MeterGroup({ label, level, peakDb, onResetPeak, on, gainDb, onSetGain, onSelect }: MeterGroupProps) {
  const left = level?.left ?? null
  const right = level?.right ?? null
  const highlighted = on === true

  const combined = left === null && right === null ? null : Math.max(left ?? -Infinity, right ?? -Infinity)

  return (
    <div className="flex flex-col items-stretch gap-1.5">
      <span className="text-center text-sm font-semibold">{label}</span>
      <div
        className={cn(
          'flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 transition-colors',
          highlighted
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-secondary/30'
        )}
      >
        <button
          type="button"
          onClick={onResetPeak}
          title="Click to reset peak"
          className={cn(
            'h-5 cursor-pointer text-sm font-bold tabular-nums leading-none transition-colors hover:opacity-70',
            zoneTextColor(peakDb, highlighted)
          )}
        >
          {formatDb(peakDb)}
        </button>
        <div className="flex gap-1">
          <MeterBar percent={levelToPercent(left)} />
          <MeterBar percent={levelToPercent(right)} />
          <ScaleColumn highlighted={highlighted} />
        </div>
        <span
          className={cn(
            'text-[10px] tabular-nums',
            highlighted ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}
        >
          {formatDb(combined)}
        </span>
        {gainDb !== undefined && onSetGain ? (
          <GainInput gainDb={gainDb} disabled={false} highlighted={highlighted} onCommit={onSetGain} />
        ) : (
          <div className="h-7" />
        )}
      </div>
      {onSelect && (
        <Button
          size="sm"
          variant={highlighted ? 'default' : 'outline'}
          disabled={highlighted}
          onClick={onSelect}
          className="w-full"
          title={
            highlighted
              ? 'Currently the sole source routed to master'
              : 'Route this input as the sole source to master, regardless of the switched video input'
          }
        >
          {highlighted ? <Check className="size-4" /> : <ArrowUpToLine className="size-4" />}
        </Button>
      )}
    </div>
  )
}

export function AudioSection({
  atemStatus,
  masterLevel,
  sourceLevels,
  audioChannels,
  onSetChannelGain,
  onSelectSoloChannel
}: AudioSectionProps) {
  const [peaks, setPeaks] = useState<Record<string, number>>({})
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setPeaks((prev) => {
      let changed = false
      const next = { ...prev }
      const consider = (key: string, level: AtemAudioLevel | null): void => {
        if (!level) return
        const value = Math.max(level.left, level.right)
        if (!Number.isFinite(value)) return
        if (next[key] === undefined || value > next[key]) {
          next[key] = value
          changed = true
        }
      }
      consider('master', masterLevel)
      for (const source of sourceLevels) {
        consider(`ch-${source.index}`, source)
      }
      return changed ? next : prev
    })
  }, [masterLevel, sourceLevels])

  function resetPeak(key: string): void {
    setPeaks((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function channelFor(index: number): AtemAudioChannelInfo | undefined {
    return audioChannels.find((c) => c.index === index)
  }

  const onChannels = audioChannels.filter((c) => c.on)
  const selectedChannelLabel =
    onChannels.length === 0 ? 'None' : onChannels.length === 1 ? `Ch ${onChannels[0].index}` : 'Multiple'

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3">
        <CardTitle className="shrink-0">Audio</CardTitle>
        {collapsed && atemStatus.connected && (
          <HorizontalMasterMeter
            level={masterLevel}
            peakDb={peaks.master ?? null}
            onResetPeak={() => resetPeak('master')}
            selectedChannelLabel={selectedChannelLabel}
          />
        )}
        {(!collapsed || !atemStatus.connected) && <div className="flex-1" />}
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setCollapsed((c) => !c)}>
          {collapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
        </Button>
      </CardHeader>
      {!collapsed && (
        <CardContent className="flex flex-col gap-2">
          {!atemStatus.connected ? (
            <p className="text-sm text-muted-foreground">Connect to the ATEM to see audio levels.</p>
          ) : (
            <div className="flex items-start justify-center gap-3 overflow-x-auto pb-1">
              {sourceLevels.length === 0 ? (
                <p className="h-32 pt-10 text-sm text-muted-foreground">
                  No per-channel source levels received yet.
                </p>
              ) : (
                sourceLevels.map((source) => {
                  const channel = channelFor(source.index)
                  return (
                    <MeterGroup
                      key={source.index}
                      label={`Ch ${source.index}`}
                      level={source}
                      peakDb={peaks[`ch-${source.index}`] ?? null}
                      onResetPeak={() => resetPeak(`ch-${source.index}`)}
                      on={channel?.on}
                      gainDb={channel?.gainDb ?? 0}
                      onSetGain={(value) => onSetChannelGain(source.index, value)}
                      onSelect={() => onSelectSoloChannel(source.index)}
                    />
                  )
                })
              )}

              <div className="mt-8 h-32 w-px shrink-0 bg-border" />

              <MeterGroup
                label="Master"
                level={masterLevel}
                peakDb={peaks.master ?? null}
                onResetPeak={() => resetPeak('master')}
              />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
