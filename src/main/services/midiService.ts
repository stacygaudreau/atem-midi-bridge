import { EventEmitter } from 'node:events'
import { Input } from '@julusian/midi'
import type { MidiActivityEvent, MidiConnectionStatus } from '@shared/types'

type MidiServiceEvents = {
  activity: [MidiActivityEvent]
  'status-changed': [MidiConnectionStatus]
}

export class MidiService extends EventEmitter<MidiServiceEvents> {
  private input = new Input()
  private portName: string | null = null
  private error: string | null = null

  listPorts(): string[] {
    return Input.getPortNames()
  }

  getStatus(): MidiConnectionStatus {
    return { connected: this.portName !== null, portName: this.portName, error: this.error }
  }

  selectPort(portName: string | null): void {
    this.closePort()
    this.error = null

    if (portName !== null) {
      try {
        this.input.ignoreTypes(true, true, true)
        this.input.openPortByName(portName)
        this.input.on('noteon', this.handleNoteOn)
        this.input.on('noteoff', this.handleNoteOff)
        this.portName = portName
      } catch (err) {
        this.portName = null
        this.error = err instanceof Error ? err.message : String(err)
      }
    }

    this.emit('status-changed', this.getStatus())
  }

  closePort(): void {
    if (this.portName !== null) {
      this.input.off('noteon', this.handleNoteOn)
      this.input.off('noteoff', this.handleNoteOff)
      this.input.closePort()
      this.portName = null
    }
  }

  private handleNoteOn = (note: number, velocity: number, info: { channel: number }): void => {
    this.emit('activity', {
      timestamp: Date.now(),
      type: 'noteon',
      channel: info.channel,
      note,
      velocity
    })
  }

  private handleNoteOff = (note: number, velocity: number, info: { channel: number }): void => {
    this.emit('activity', {
      timestamp: Date.now(),
      type: 'noteoff',
      channel: info.channel,
      note,
      velocity
    })
  }
}
