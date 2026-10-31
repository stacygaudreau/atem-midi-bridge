import type { AtemConnectionStatus } from '@shared/types'
import { Card, CardHeader, CardTitle, CardContent } from '@renderer/components/ui/card'

interface DeviceInfoPanelProps {
  atemStatus: AtemConnectionStatus
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

export function DeviceInfoPanel({ atemStatus }: DeviceInfoPanelProps) {
  const info = atemStatus.deviceInfo

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device info</CardTitle>
      </CardHeader>
      <CardContent>
        {!atemStatus.connected || !info ? (
          <p className="text-sm text-muted-foreground">Connect to the ATEM to see device info.</p>
        ) : (
          <div className="divide-y divide-border">
            <Row label="Model" value={info.model} />
            <Row label="IP address" value={atemStatus.ip ?? 'Unknown'} />
            <Row label="Protocol version" value={info.protocolVersion ?? 'Unknown'} />
            {info.productIdentifier && <Row label="Product identifier" value={info.productIdentifier} />}
            {info.capabilities && (
              <>
                <Row label="Mix effects (M/E)" value={info.capabilities.mixEffects} />
                <Row label="Inputs" value={info.capabilities.sources} />
                <Row label="Downstream keyers" value={info.capabilities.downstreamKeyers} />
                <Row label="Media players" value={info.capabilities.mediaPlayers} />
                <Row label="Aux outputs" value={info.capabilities.auxiliaries} />
                {info.capabilities.superSources > 0 && (
                  <Row label="Super sources" value={info.capabilities.superSources} />
                )}
              </>
            )}
            {info.multiviewerCount !== null && <Row label="Multiviewers" value={info.multiviewerCount} />}
            {info.mediaPoolStills !== null && <Row label="Media pool stills" value={info.mediaPoolStills} />}
            {info.mediaPoolClips !== null && <Row label="Media pool clips" value={info.mediaPoolClips} />}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
