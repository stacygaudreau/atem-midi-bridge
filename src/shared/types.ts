import { z } from 'zod'

/**
 * A MidiTrigger describes the incoming MIDI event a mapping listens for.
 * Only 'noteon' is implemented today. The discriminated union exists so new
 * trigger kinds (cc, programchange, ...) can be added later without touching
 * the matching/dispatch logic in MappingEngine.
 */
export const MidiTriggerSchema = z.object({
  type: z.literal('noteon'),
  note: z.number().int().min(0).max(127),
  channel: z.union([z.number().int().min(0).max(15), z.literal('any')])
})
export type MidiTrigger = z.infer<typeof MidiTriggerSchema>

/**
 * An AtemAction describes what the switcher should do when a trigger fires.
 * Only 'cut' is implemented today. New action kinds (autoTransition, setDsk,
 * audio fader moves, ...) plug in by adding a union member here and a
 * handler in actionHandlers.ts -- MappingEngine's dispatch loop is unaware
 * of the concrete action kinds.
 */
export const AtemActionSchema = z.object({
  type: z.literal('cut'),
  input: z.number().int().min(1)
})
export type AtemAction = z.infer<typeof AtemActionSchema>

export const MappingSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  enabled: z.boolean(),
  trigger: MidiTriggerSchema,
  action: AtemActionSchema
})
export type Mapping = z.infer<typeof MappingSchema>

export const NewMappingSchema = MappingSchema.omit({ id: true })
export type NewMapping = z.infer<typeof NewMappingSchema>

export interface AppSettings {
  atemIp: string | null
  midiPortName: string | null
  mappings: Mapping[]
}

export interface AtemCapabilitiesInfo {
  mixEffects: number
  sources: number
  downstreamKeyers: number
  mediaPlayers: number
  auxiliaries: number
  superSources: number
}

export interface AtemVideoModeInfo {
  id: number
  name: string
}

export interface AtemDeviceInfo {
  model: string
  modelId: number
  isIsoCapable: boolean
  protocolVersion: string | null
  productIdentifier: string | null
  capabilities: AtemCapabilitiesInfo | null
  multiviewerCount: number | null
  mediaPoolStills: number | null
  mediaPoolClips: number | null
  currentVideoMode: AtemVideoModeInfo | null
  supportedVideoModes: AtemVideoModeInfo[]
}

export interface AtemConnectionStatus {
  connected: boolean
  connecting: boolean
  ip: string | null
  error: string | null
  deviceInfo: AtemDeviceInfo | null
  programInput: number | null
}

export interface MidiConnectionStatus {
  connected: boolean
  portName: string | null
  error: string | null
}

export interface AtemInputInfo {
  id: number
  name: string
}

export interface MidiActivityEvent {
  timestamp: number
  type: 'noteon' | 'noteoff' | 'other'
  channel: number
  note: number
  velocity: number
}

export interface MappingTriggeredEvent {
  timestamp: number
  mapping: Mapping
  ok: boolean
  error?: string
}

export type AtemRecordingDiskStatus = 'idle' | 'active' | 'recording' | 'unformatted' | 'removed'

export interface AtemRecordingDiskInfo {
  id: number
  volumeName: string
  status: AtemRecordingDiskStatus
  recordingTimeAvailableSeconds: number
}

export interface AtemRecordingStatus {
  recording: boolean
  stopping: boolean
  durationSeconds: number | null
  disks: AtemRecordingDiskInfo[]
  filename: string
  recordAllInputs: boolean
}

export interface DiscoveredAtem {
  name: string
  ip: string
}

export interface AtemAudioLevel {
  left: number
  right: number
}

export interface AtemAudioSourceLevel extends AtemAudioLevel {
  index: number
}

export interface AtemAudioChannelInfo {
  index: number
  gainDb: number
  on: boolean
}
