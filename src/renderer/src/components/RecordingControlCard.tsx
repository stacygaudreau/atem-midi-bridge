import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Circle, Square } from 'lucide-react'
import type { AtemConnectionStatus, AtemRecordingDiskStatus, AtemRecordingStatus } from '@shared/types'
import { Card, CardHeader, CardTitle, CardContent } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Switch } from '@renderer/components/ui/switch'
import { Badge } from '@renderer/components/ui/badge'
import { cn } from '@renderer/lib/utils'
import { VideoFormatPicker } from '@renderer/components/VideoFormatPicker'

interface RecordingControlCardProps {
  atemStatus: AtemConnectionStatus
  recordingStatus: AtemRecordingStatus
  onStartRecording: () => void
  onStopRecording: () => void
  recordingBusy: boolean
  onSetFilename: (filename: string) => void
  onSetRecordAllInputs: (enabled: boolean) => void
  onSetVideoMode: (mode: number) => void
}

const DISK_COLOR: Record<AtemRecordingDiskStatus, string> = {
  recording: 'bg-destructive',
  idle: 'bg-success',
  active: 'bg-success',
  unformatted: 'bg-warning',
  removed: 'bg-zinc-600'
}

const DISK_LABEL: Record<AtemRecordingDiskStatus, string> = {
  recording: 'Recording',
  idle: 'Ready',
  active: 'Active',
  unformatted: 'Unformatted',
  removed: 'No disk'
}

const NO_MEDIA_SENTINEL = 0xfffffffe

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '00:00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

function formatAvailableTime(seconds: number): string {
  if (seconds < 0 || seconds >= NO_MEDIA_SENTINEL) return '—'
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}h ${m}m`
  }
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return s > 0 ? `${m}m ${s}s` : `${m}m`
  }
  return `${Math.floor(seconds)}s`
}

export function RecordingControlCard({
  atemStatus,
  recordingStatus,
  onStartRecording,
  onStopRecording,
  recordingBusy,
  onSetFilename,
  onSetRecordAllInputs,
  onSetVideoMode
}: RecordingControlCardProps) {
  const [filenameInput, setFilenameInput] = useState(recordingStatus.filename)
  const [editingFilename, setEditingFilename] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const filenameLocked = recordingStatus.recording || recordingStatus.stopping
  const connected = atemStatus.connected
  const deviceInfo = atemStatus.deviceInfo
  const hasRecordableDisk = recordingStatus.disks.some(
    (disk) => disk.status === 'idle' || disk.status === 'active' || disk.status === 'recording'
  )

  useEffect(() => {
    if (!editingFilename) setFilenameInput(recordingStatus.filename)
  }, [recordingStatus.filename, editingFilename])

  function commitFilename(): void {
    setEditingFilename(false)
    if (filenameInput !== recordingStatus.filename) onSetFilename(filenameInput)
  }

  const disks = connected ? recordingStatus.disks : []
  const recordingAlert = collapsed && recordingStatus.recording
  const mutedTextClass = recordingAlert ? 'text-destructive-foreground/80' : 'text-muted-foreground'

  return (
    <Card className={cn(recordingAlert && 'bg-destructive')}>
      <CardHeader className={cn('flex-row items-center gap-3', recordingAlert && 'text-destructive-foreground')}>
        <CardTitle className={cn('shrink-0', recordingAlert && 'text-destructive-foreground')}>Recording</CardTitle>
        {collapsed ? (
          <div
            className={cn(
              'flex h-9 flex-1 items-stretch divide-x',
              recordingAlert ? 'divide-destructive-foreground/30' : 'divide-border'
            )}
          >
            <div className="flex flex-1 items-center justify-center gap-2.5 px-4">
                <Button
                  size="icon"
                  className="w-12"
                  variant={recordingAlert ? 'secondary' : 'destructive'}
                  title="Record"
                  aria-label="Record"
                  onClick={onStartRecording}
                  disabled={
                    !connected ||
                    recordingBusy ||
                    recordingStatus.recording ||
                    recordingStatus.stopping ||
                    !hasRecordableDisk
                  }
                >
                  <Circle className="size-4 fill-current" />
                </Button>
                <Button
                  size="icon"
                  className="w-12"
                  variant={recordingAlert ? 'secondary' : 'outline'}
                  title="Stop"
                  aria-label="Stop"
                  onClick={onStopRecording}
                  disabled={!connected || recordingBusy || !recordingStatus.recording}
                >
                  <Square className="size-4" />
                </Button>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center gap-0.5 px-4">
              <span className={cn('text-[10px] uppercase tracking-wide', mutedTextClass)}>Duration</span>
              <span className={cn('text-sm font-semibold leading-none tabular-nums', !connected && mutedTextClass)}>
                {connected ? formatDuration(recordingStatus.durationSeconds) : '—'}
              </span>
            </div>
            {disks.length === 0 && (
              <div className="flex flex-1 flex-col items-center justify-center gap-0.5 px-4">
                <span className={cn('text-[10px] uppercase tracking-wide', mutedTextClass)}>Disks</span>
                <span className={cn('text-sm font-semibold leading-none', mutedTextClass)}>—</span>
              </div>
            )}
            {disks.map((disk) => (
              <div
                key={disk.id}
                className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-4"
                title={DISK_LABEL[disk.status]}
              >
                <span className={cn('flex items-center gap-1.5 text-[10px] uppercase tracking-wide', mutedTextClass)}>
                  <span className={cn('size-2 shrink-0 rounded-full', DISK_COLOR[disk.status])} />
                  <span className="max-w-24 truncate">{disk.volumeName || 'Unnamed'}</span>
                </span>
                <span className="text-sm font-semibold leading-none tabular-nums">
                  {formatAvailableTime(disk.recordingTimeAvailableSeconds)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="flex-1" />
            <Badge variant={recordingStatus.recording ? 'destructive' : 'outline'}>
              {!connected
                ? 'Not connected'
                : recordingStatus.stopping
                  ? 'Stopping…'
                  : recordingStatus.recording
                    ? 'Recording'
                    : 'Idle'}
            </Badge>
          </>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn('shrink-0', recordingAlert && 'text-destructive-foreground hover:bg-destructive-foreground/10')}
          onClick={() => setCollapsed((c) => !c)}
        >
          {collapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
        </Button>
      </CardHeader>
      {!collapsed && (
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-stretch gap-4">
          <div className="flex shrink-0 items-center gap-4 rounded-lg bg-secondary/30 p-4">
            <Button
              size="lg"
              variant="destructive"
              className="h-12 w-20 [&_svg]:size-5"
              title="Record"
              aria-label="Record"
              onClick={onStartRecording}
              disabled={
                !connected ||
                recordingBusy ||
                recordingStatus.recording ||
                recordingStatus.stopping ||
                !hasRecordableDisk
              }
            >
              <Circle className="size-4 fill-current" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 w-20 [&_svg]:size-5"
              title="Stop"
              aria-label="Stop"
              onClick={onStopRecording}
              disabled={!connected || recordingBusy || !recordingStatus.recording}
            >
              <Square className="size-4" />
            </Button>
          </div>

          <div className="flex w-36 shrink-0 flex-col justify-center gap-1.5 rounded-lg bg-secondary/30 p-4">
            <Label>Duration</Label>
            <div className="flex h-9 items-center text-sm tabular-nums text-muted-foreground">
              {connected ? formatDuration(recordingStatus.durationSeconds) : '—'}
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-center gap-1.5 rounded-lg bg-secondary/30 p-4">
            <Label htmlFor="rec-filename">Filename</Label>
            <Input
              id="rec-filename"
              value={connected ? filenameInput : ''}
              placeholder={connected ? undefined : 'Not connected'}
              disabled={!connected || filenameLocked}
              onFocus={() => setEditingFilename(true)}
              onChange={(e) => setFilenameInput(e.target.value)}
              onBlur={commitFilename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur()
              }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Disks</span>
          {!connected ? (
            <p className="text-sm text-muted-foreground">Connect to the ATEM to see disk info.</p>
          ) : disks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No disk info.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {disks.map((disk) => (
                <div
                  key={disk.id}
                  className="grid grid-cols-[auto_auto_1fr_auto_auto] items-center gap-3 rounded-md bg-secondary/40 p-3 text-sm"
                >
                  <span className={cn('size-2.5 shrink-0 rounded-full', DISK_COLOR[disk.status])} />
                  <span className="font-medium">Disk {disk.id}</span>
                  <span className="truncate text-muted-foreground">{disk.volumeName || 'Unnamed'}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {DISK_LABEL[disk.status]}
                  </Badge>
                  <span className="text-right tabular-nums text-muted-foreground">
                    {formatAvailableTime(disk.recordingTimeAvailableSeconds)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-stretch gap-4">
          <div className="flex flex-1 flex-col justify-center gap-1.5 rounded-lg bg-secondary/30 p-4">
            <Label htmlFor="rec-video-format">Video format</Label>
            {connected && deviceInfo ? (
              <VideoFormatPicker
                id="rec-video-format"
                info={deviceInfo}
                disabled={recordingStatus.recording || recordingStatus.stopping}
                onSetVideoMode={onSetVideoMode}
              />
            ) : (
              <div className="flex h-9 items-center text-sm text-muted-foreground">Not connected</div>
            )}
          </div>

          {deviceInfo?.isIsoCapable && (
            <div className="flex shrink-0 flex-col justify-center gap-1.5 rounded-lg bg-secondary/30 p-4">
              <Label htmlFor="record-all-inputs">ISO recording</Label>
              <div className="flex h-9 items-center gap-2">
                <Switch
                  id="record-all-inputs"
                  checked={recordingStatus.recordAllInputs}
                  disabled={!connected || recordingStatus.recording || recordingStatus.stopping}
                  onCheckedChange={onSetRecordAllInputs}
                />
                <span className="text-sm text-muted-foreground">Record all inputs</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      )}
    </Card>
  )
}
