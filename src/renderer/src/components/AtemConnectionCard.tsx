import { useEffect, useState } from 'react'
import { RefreshCw, Wifi } from 'lucide-react'
import type { AtemConnectionStatus, DiscoveredAtem } from '@shared/types'
import { Card, CardHeader, CardTitle, CardContent } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Badge } from '@renderer/components/ui/badge'

interface AtemConnectionCardProps {
  atemIpInput: string
  onAtemIpInputChange: (value: string) => void
  atemStatus: AtemConnectionStatus
  onConnectAtem: () => void
  onDisconnectAtem: () => void
}

export function AtemConnectionCard({
  atemIpInput,
  onAtemIpInputChange,
  atemStatus,
  onConnectAtem,
  onDisconnectAtem
}: AtemConnectionCardProps) {
  const [discovered, setDiscovered] = useState<DiscoveredAtem[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    void window.api.atem.startDiscovery()
    void window.api.atem.getDiscoveredDevices().then(setDiscovered)
    return window.api.atem.onDiscoveryUpdated(setDiscovered)
  }, [])

  const locked = atemStatus.connected || atemStatus.connecting

  function handleRefreshDiscovery(): void {
    setRefreshing(true)
    void window.api.atem.refreshDiscovery().finally(() => {
      setTimeout(() => setRefreshing(false), 1500)
    })
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>ATEM switcher</CardTitle>
        <Badge variant={atemStatus.connected ? 'success' : atemStatus.connecting ? 'secondary' : 'outline'}>
          {atemStatus.connected ? 'Connected' : atemStatus.connecting ? 'Connecting…' : 'Disconnected'}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Discovered on network
            </Label>
            <Button type="button" variant="ghost" size="sm" onClick={handleRefreshDiscovery} disabled={refreshing}>
              <RefreshCw className={refreshing ? 'size-3.5 animate-spin' : 'size-3.5'} />
              {refreshing ? 'Discovering…' : 'Discover devices'}
            </Button>
          </div>
          {discovered.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Searching for ATEM switchers on this network… none found yet. Make sure it's powered on and on the
              same network, or enter its IP manually below.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {discovered.map((device) => (
                <Button
                  key={device.ip}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={locked}
                  onClick={() => onAtemIpInputChange(device.ip)}
                >
                  <Wifi className="size-3.5" />
                  {device.name} · {device.ip}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="atem-ip">IP address</Label>
          <Input
            id="atem-ip"
            className="mt-1.5"
            placeholder="192.168.1.50"
            value={atemIpInput}
            onChange={(e) => onAtemIpInputChange(e.target.value)}
            disabled={locked}
          />
        </div>
        <div className="flex gap-2">
          {locked ? (
            <Button variant="outline" onClick={onDisconnectAtem} className="flex-1">
              Disconnect
            </Button>
          ) : (
            <Button onClick={onConnectAtem} className="flex-1" disabled={!atemIpInput.trim()}>
              Connect
            </Button>
          )}
        </div>
        {atemStatus.error && <p className="text-xs text-destructive">{atemStatus.error}</p>}
      </CardContent>
    </Card>
  )
}
