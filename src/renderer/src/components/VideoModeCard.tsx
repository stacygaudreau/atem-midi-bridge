import type { AtemConnectionStatus } from '@shared/types'
import { Card, CardHeader, CardTitle, CardContent } from '@renderer/components/ui/card'
import { Label } from '@renderer/components/ui/label'
import { VideoFormatPicker } from '@renderer/components/VideoFormatPicker'

interface VideoModeCardProps {
  atemStatus: AtemConnectionStatus
  onSetVideoMode: (mode: number) => void
}

export function VideoModeCard({ atemStatus, onSetVideoMode }: VideoModeCardProps) {
  const info = atemStatus.deviceInfo

  return (
    <Card>
      <CardHeader>
        <CardTitle>Switcher video standard</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {!atemStatus.connected || !info ? (
          <p className="text-sm text-muted-foreground">Connect to the ATEM to change the video standard.</p>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="video-mode">Video standard</Label>
              <VideoFormatPicker id="video-mode" info={info} onSetVideoMode={onSetVideoMode} />
            </div>
            {info.currentVideoMode && (
              <p className="text-xs text-muted-foreground">Current: {info.currentVideoMode.name}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
