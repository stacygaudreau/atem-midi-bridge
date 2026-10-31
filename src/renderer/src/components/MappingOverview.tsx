import { useState } from 'react'
import { ChevronDown, ChevronUp, Settings2 } from 'lucide-react'
import type { AtemInputInfo, Mapping } from '@shared/types'
import { Card, CardHeader, CardTitle, CardContent } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { cubaseNoteName } from '@renderer/lib/midiNotes'

interface MappingOverviewProps {
  mappings: Mapping[]
  atemInputs: AtemInputInfo[]
  currentProgramInput: number | null
  atemConnected: boolean
  onSelectInput: (input: number) => void
  onManage: () => void
}

export function MappingOverview({
  mappings,
  atemInputs,
  currentProgramInput,
  atemConnected,
  onSelectInput,
  onManage
}: MappingOverviewProps) {
  const [collapsed, setCollapsed] = useState(false)

  function inputName(id: number): string {
    return atemInputs.find((input) => input.id === id)?.name ?? `Input ${id}`
  }

  const showCompactStrip = collapsed && mappings.length > 0

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3">
        <CardTitle className="shrink-0">Video</CardTitle>
        {showCompactStrip && (
          <div className="flex h-9 min-w-0 flex-1 items-stretch justify-center gap-1.5 px-3">
            {mappings.map((mapping) => {
              const isLive = mapping.action.input === currentProgramInput
              return (
                <button
                  key={mapping.id}
                  type="button"
                  title={`Cut to input ${mapping.action.input}${atemConnected ? '' : ' (connect to the ATEM first)'}`}
                  disabled={!atemConnected}
                  onClick={() => onSelectInput(mapping.action.input)}
                  className={cn(
                    'flex min-w-12 max-w-32 flex-1 basis-0 items-center justify-center rounded-md border text-lg font-bold tabular-nums transition-colors',
                    'enabled:cursor-pointer enabled:hover:brightness-110 enabled:active:brightness-95',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed',
                    isLive ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-secondary/30',
                    !mapping.enabled && 'opacity-50'
                  )}
                >
                  {mapping.action.input}
                </button>
              )
            })}
          </div>
        )}
        {!showCompactStrip && <div className="flex-1" />}
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onManage}>
            <Settings2 className="size-4" />
            Manage
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCollapsed((c) => !c)}>
            {collapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
          </Button>
        </div>
      </CardHeader>
      {!collapsed && (
      <CardContent>
      {mappings.length === 0 ? (
        <span className="py-2 text-sm text-muted-foreground">No mappings configured yet.</span>
      ) : (
        <div className="flex flex-wrap justify-center gap-2">
          {mappings.map((mapping) => {
            const isLive = mapping.action.input === currentProgramInput
            return (
              <div
                key={mapping.id}
                className={cn('flex flex-col items-center gap-1', !mapping.enabled && 'opacity-50')}
              >
                <span className="max-w-28 truncate text-center text-sm font-semibold">
                  {inputName(mapping.action.input)}
                </span>
                <button
                  type="button"
                  title={`Cut to input ${mapping.action.input}${atemConnected ? '' : ' (connect to the ATEM first)'}`}
                  disabled={!atemConnected}
                  onClick={() => onSelectInput(mapping.action.input)}
                  className={cn(
                    'flex size-24 items-center justify-center rounded-xl border text-center transition-colors',
                    'enabled:cursor-pointer enabled:hover:brightness-110 enabled:active:brightness-95',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed',
                    isLive ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-secondary/30'
                  )}
                >
                  <span className="text-3xl font-bold leading-none tabular-nums">{mapping.action.input}</span>
                </button>
                <span className="text-xs font-semibold text-foreground">
                  #{mapping.trigger.note} ({cubaseNoteName(mapping.trigger.note)})
                </span>
              </div>
            )
          })}
        </div>
      )}
      </CardContent>
      )}
    </Card>
  )
}
