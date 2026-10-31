import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import type { MidiConnectionStatus } from '@shared/types'
import { Card, CardHeader, CardTitle, CardContent } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Label } from '@renderer/components/ui/label'
import { Badge } from '@renderer/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@renderer/components/ui/select'

interface MidiConnectionCardProps {
  midiPorts: string[]
  selectedMidiPort: string | null
  midiStatus: MidiConnectionStatus
  onSelectMidiPort: (port: string | null) => void
  onRefreshMidiPorts: () => void
}

export function MidiConnectionCard({
  midiPorts,
  selectedMidiPort,
  midiStatus,
  onSelectMidiPort,
  onRefreshMidiPorts
}: MidiConnectionCardProps) {
  const [refreshing, setRefreshing] = useState(false)

  function handleRefresh(): void {
    setRefreshing(true)
    onRefreshMidiPorts()
    setTimeout(() => setRefreshing(false), 400)
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>MIDI input</CardTitle>
        <Badge variant={midiStatus.connected ? 'success' : 'outline'}>
          {midiStatus.connected ? 'Connected' : 'Disconnected'}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="midi-port">Port</Label>
            <Select value={selectedMidiPort ?? ''} onValueChange={(v) => onSelectMidiPort(v || null)}>
              <SelectTrigger id="midi-port" className="mt-1.5">
                <SelectValue placeholder="Select a MIDI port" />
              </SelectTrigger>
              <SelectContent>
                {midiPorts.map((port) => (
                  <SelectItem key={port} value={port}>
                    {port}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className={refreshing ? 'size-4 animate-spin' : 'size-4'} />
          </Button>
        </div>
        {midiStatus.error && <p className="text-xs text-destructive">{midiStatus.error}</p>}
        {midiPorts.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No MIDI ports found. Create a virtual port from your DAW/MIDI driver and refresh.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
