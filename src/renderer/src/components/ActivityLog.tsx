import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { MappingTriggeredEvent, MidiActivityEvent } from '@shared/types'
import { Card, CardHeader, CardTitle, CardContent } from '@renderer/components/ui/card'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'

interface ActivityLogProps {
  triggered: MappingTriggeredEvent[]
  lastMidiActivity: MidiActivityEvent | null
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour12: false })
}

export function ActivityLog({ triggered, lastMidiActivity }: ActivityLogProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Activity</CardTitle>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {lastMidiActivity
              ? `Last MIDI: note ${lastMidiActivity.note} (ch ${lastMidiActivity.channel + 1}) at ${formatTime(lastMidiActivity.timestamp)}`
              : 'No MIDI received yet'}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setCollapsed((c) => !c)}>
            {collapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
          </Button>
        </div>
      </CardHeader>
      {!collapsed && (
        <CardContent>
          <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto">
            {triggered.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Switch triggers will appear here once a mapped note comes in.
              </p>
            )}
            {triggered.map((event, i) => (
              <div
                key={`${event.timestamp}-${i}`}
                className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-1.5 text-sm"
              >
                <span>
                  {formatTime(event.timestamp)} · {event.mapping.label || `Note ${event.mapping.trigger.note}`}{' '}
                  → input {event.mapping.action.input}
                </span>
                <Badge variant={event.ok ? 'success' : 'destructive'}>
                  {event.ok ? 'OK' : event.error ?? 'Error'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
