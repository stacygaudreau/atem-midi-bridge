import { EventEmitter } from 'node:events'
import type { Mapping, MappingTriggeredEvent, MidiActivityEvent } from '@shared/types'
import type { MidiService } from './midiService'
import type { AtemService } from './atemService'
import type { SettingsStore } from './settingsStore'
import { actionHandlers } from './actionHandlers'

type MappingEngineEvents = {
  triggered: [MappingTriggeredEvent]
}

/**
 * Matches incoming MIDI activity against the user's mapping table and dispatches
 * the corresponding ATEM action. Matching only understands 'noteon' triggers today,
 * but the switch below is the single spot to extend when 'cc'/'pc' triggers are added.
 */
export class MappingEngine extends EventEmitter<MappingEngineEvents> {
  constructor(
    private midi: MidiService,
    private atem: AtemService,
    private settings: SettingsStore
  ) {
    super()
    this.midi.on('activity', this.handleMidiActivity)
  }

  private handleMidiActivity = (event: MidiActivityEvent): void => {
    if (event.type !== 'noteon') return

    for (const mapping of this.settings.getMappings()) {
      if (!mapping.enabled) continue
      if (mapping.trigger.note !== event.note) continue
      if (mapping.trigger.channel !== 'any' && mapping.trigger.channel !== event.channel) continue
      void this.dispatch(mapping)
    }
  }

  private async dispatch(mapping: Mapping): Promise<void> {
    const result: MappingTriggeredEvent = { timestamp: Date.now(), mapping, ok: true }
    try {
      const handler = actionHandlers[mapping.action.type]
      await handler(this.atem, mapping.action)
    } catch (err) {
      result.ok = false
      result.error = err instanceof Error ? err.message : String(err)
    }
    this.emit('triggered', result)
  }
}
