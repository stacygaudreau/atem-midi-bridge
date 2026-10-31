import { EventEmitter } from 'node:events'
import { isIPv4 } from 'node:net'
import { Bonjour, type Browser, type Service } from 'bonjour-service'
import type { DiscoveredAtem } from '@shared/types'

type AtemDiscoveryEvents = {
  updated: [DiscoveredAtem[]]
}

/**
 * Browses for ATEM switchers via mDNS/Bonjour. Different firmware generations
 * announce differently: some advertise `_blackmagic._tcp.local.` (TXT
 * class=AtemSwitcher -- what Blackmagic's ATEM Setup/Software Control and
 * Bitfocus Companion's module key off), but a real ATEM Mini Pro ISO on firmware
 * 10.3 was confirmed to NOT announce that service at all -- it only shows up via
 * `_switcher_ctrl._udp.local.`. Both are browsed and merged by IP so either
 * generation is found. Only finds devices on the same subnet -- mDNS doesn't route.
 */
export class AtemDiscoveryService extends EventEmitter<AtemDiscoveryEvents> {
  private bonjour: Bonjour | null = null
  private browsers: Browser[] = []
  private devices = new Map<string, DiscoveredAtem>()

  start(): void {
    if (this.bonjour) return
    const bonjour = new Bonjour()
    this.bonjour = bonjour

    const addFromService = (service: Service): void => {
      const ip = service.addresses?.find((address) => isIPv4(address))
      if (!ip) return
      this.devices.set(ip, { name: service.name, ip })
      this.emitUpdated()
    }

    const removeFromService = (service: Service): void => {
      const ip = service.addresses?.find((address) => isIPv4(address))
      if (!ip) return
      this.devices.delete(ip)
      this.emitUpdated()
    }

    const blackmagicBrowser = bonjour.find({ type: 'blackmagic', protocol: 'tcp' })
    blackmagicBrowser.on('up', (service) => {
      if (service.txt?.class === 'AtemSwitcher') addFromService(service)
    })
    blackmagicBrowser.on('down', removeFromService)

    const switcherCtrlBrowser = bonjour.find({ type: 'switcher_ctrl', protocol: 'udp' })
    switcherCtrlBrowser.on('up', addFromService)
    switcherCtrlBrowser.on('down', removeFromService)

    this.browsers = [blackmagicBrowser, switcherCtrlBrowser]
  }

  /** Re-sends the mDNS query on demand, e.g. for a manual "refresh" button. */
  refresh(): void {
    this.start()
    for (const browser of this.browsers) browser.update()
  }

  getDevices(): DiscoveredAtem[] {
    return Array.from(this.devices.values())
  }

  private emitUpdated(): void {
    this.emit('updated', this.getDevices())
  }
}
