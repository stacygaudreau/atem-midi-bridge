import Store from 'electron-store'
import { randomUUID } from 'node:crypto'
import type { AppSettings, Mapping, NewMapping } from '@shared/types'

const DEFAULT_MAPPINGS: Mapping[] = [
  {
    id: randomUUID(),
    label: 'Camera 1',
    enabled: true,
    trigger: { type: 'noteon', note: 60, channel: 'any' },
    action: { type: 'cut', input: 1 }
  },
  {
    id: randomUUID(),
    label: 'Camera 2',
    enabled: true,
    trigger: { type: 'noteon', note: 61, channel: 'any' },
    action: { type: 'cut', input: 2 }
  },
  {
    id: randomUUID(),
    label: 'Camera 3',
    enabled: true,
    trigger: { type: 'noteon', note: 62, channel: 'any' },
    action: { type: 'cut', input: 3 }
  },
  {
    id: randomUUID(),
    label: 'Camera 4',
    enabled: true,
    trigger: { type: 'noteon', note: 63, channel: 'any' },
    action: { type: 'cut', input: 4 }
  }
]

export class SettingsStore {
  private store = new Store<AppSettings>({
    name: 'atem-midi-bridge-settings',
    defaults: {
      atemIp: null,
      midiPortName: null,
      mappings: DEFAULT_MAPPINGS
    }
  })

  getAtemIp(): string | null {
    return this.store.get('atemIp')
  }

  setAtemIp(ip: string | null): void {
    this.store.set('atemIp', ip)
  }

  getMidiPortName(): string | null {
    return this.store.get('midiPortName')
  }

  setMidiPortName(name: string | null): void {
    this.store.set('midiPortName', name)
  }

  getMappings(): Mapping[] {
    return this.store.get('mappings')
  }

  addMapping(mapping: NewMapping): Mapping[] {
    const mappings = [...this.getMappings(), { ...mapping, id: randomUUID() }]
    this.store.set('mappings', mappings)
    return mappings
  }

  updateMapping(mapping: Mapping): Mapping[] {
    const mappings = this.getMappings().map((m) => (m.id === mapping.id ? mapping : m))
    this.store.set('mappings', mappings)
    return mappings
  }

  removeMapping(id: string): Mapping[] {
    const mappings = this.getMappings().filter((m) => m.id !== id)
    this.store.set('mappings', mappings)
    return mappings
  }

  setMappingEnabled(id: string, enabled: boolean): Mapping[] {
    const mappings = this.getMappings().map((m) => (m.id === id ? { ...m, enabled } : m))
    this.store.set('mappings', mappings)
    return mappings
  }
}
