import { EventEmitter } from 'node:events'
import { Atem, AtemConnectionStatus as AtemLibStatus, Commands, Enums } from 'atem-connection'
import type {
  AtemAudioChannelInfo,
  AtemAudioLevel,
  AtemAudioSourceLevel,
  AtemConnectionStatus,
  AtemDeviceInfo,
  AtemInputInfo,
  AtemRecordingDiskInfo,
  AtemRecordingDiskStatus,
  AtemRecordingStatus,
  AtemVideoModeInfo
} from '@shared/types'
import { isIsoCapableModel, modelName, protocolVersionName } from './atemModelNames'
import { videoModeName } from './atemVideoModeNames'

type AtemServiceEvents = {
  'status-changed': [AtemConnectionStatus]
  'recording-changed': [AtemRecordingStatus]
  'master-level-changed': [AtemAudioLevel | null]
  'source-levels-changed': [AtemAudioSourceLevel[]]
  'audio-channels-changed': [AtemAudioChannelInfo[]]
}

const AUDIO_LEVEL_EMIT_INTERVAL_MS = 50

// RecordingDiskStatus values (1, 2, 4, 8, 32) are bit flags, not mutually-exclusive
// states -- a disk can report e.g. Idle|Active together, so this must use bitwise
// checks rather than exact equality (which would fall through to "removed" for any
// combined value never seen on its own).
function diskStatusToString(status: Enums.RecordingDiskStatus): AtemRecordingDiskStatus {
  if (status & Enums.RecordingDiskStatus.Recording) return 'recording'
  if (status & Enums.RecordingDiskStatus.Active) return 'active'
  if (status & Enums.RecordingDiskStatus.Idle) return 'idle'
  if (status & Enums.RecordingDiskStatus.Unformatted) return 'unformatted'
  return 'removed'
}

export class AtemService extends EventEmitter<AtemServiceEvents> {
  private atem = new Atem()
  private ip: string | null = null
  private error: string | null = null
  private latestMasterLevel: AtemAudioLevel | null = null
  private latestSourceLevels = new Map<number, AtemAudioLevel>()
  private sawFirstMasterLevel = false
  private sawFirstSourceLevel = false

  constructor() {
    super()
    this.atem.on('connected', () => {
      this.error = null
      this.emitStatus()
      this.emit('recording-changed', this.getRecordingStatus())
      this.atem
        .startFairlightMixerSendLevels()
        .catch((err) => console.error('[atem] startFairlightMixerSendLevels failed:', err))
    })
    this.atem.on('disconnected', () => {
      this.latestMasterLevel = null
      this.latestSourceLevels.clear()
      this.emitStatus()
      this.emit('recording-changed', this.getRecordingStatus())
      this.emit('audio-channels-changed', this.getAudioChannels())
      this.emit('master-level-changed', null)
      this.emit('source-levels-changed', [])
    })
    // atem-connection's own 'levelChanged' event gates on `instanceof
    // Commands.FairlightMixer*LevelsUpdateCommand`, which never matches here
    // (confirmed: the commands demonstrably arrive via 'receivedCommands', but
    // 'levelChanged' never fires) -- so read them directly off the raw command by
    // constructor name instead, which does survive intact.
    this.atem.on('receivedCommands', (commands) => {
      for (const command of commands) {
        const name = command.constructor.name
        if (name === 'FairlightMixerMasterLevelsUpdateCommand') {
          const props = (command as unknown as { properties: { leftLevel: number; rightLevel: number } })
            .properties
          // Levels arrive as int16 centibels (hundredths of a dB), not plain dB.
          this.latestMasterLevel = { left: props.leftLevel / 100, right: props.rightLevel / 100 }
          if (!this.sawFirstMasterLevel) {
            this.sawFirstMasterLevel = true
            console.log('[atem] first master level captured:', this.latestMasterLevel)
          }
        } else if (name === 'FairlightMixerSourceLevelsUpdateCommand') {
          const typed = command as unknown as {
            index: number
            properties: { outputLeftLevel: number; outputRightLevel: number }
          }
          // Per-source levels report three stages: input* (pre-gain), output*
          // (post-gain/post-processing), and a trailing plain left/rightLevel.
          // Use output* so the meter reflects the level after this channel's
          // own gain setting, not the raw pre-gain input level.
          const sourceLevel = {
            left: typed.properties.outputLeftLevel / 100,
            right: typed.properties.outputRightLevel / 100
          }
          this.latestSourceLevels.set(typed.index, sourceLevel)
          if (!this.sawFirstSourceLevel) {
            this.sawFirstSourceLevel = true
            console.log('[atem] first source level captured: index', typed.index, sourceLevel)
          }
        }
      }
    })
    this.atem.on('error', (message) => {
      this.error = message
      this.emitStatus()
    })
    this.atem.on('stateChanged', (_state, pathsChanged) => {
      if (pathsChanged.some((path) => path.startsWith('recording'))) {
        this.emit('recording-changed', this.getRecordingStatus())
      }
      if (
        pathsChanged.some(
          (path) => path.startsWith('settings') || path.startsWith('info') || path.startsWith('video')
        )
      ) {
        this.emitStatus()
      }
      if (pathsChanged.some((path) => path.startsWith('fairlight'))) {
        this.emit('audio-channels-changed', this.getAudioChannels())
      }
    })

    // The ATEM doesn't push recording duration ticks on its own -- it has to be polled,
    // otherwise the displayed duration only changes when some other command happens to
    // trigger a state refresh (e.g. stopping the recording).
    setInterval(() => {
      if (this.atem.status === AtemLibStatus.CONNECTED && this.getRecordingStatus().recording) {
        this.atem.requestRecordingDuration().catch(() => {})
      }
    }, 1000)

    // Fairlight level updates can arrive much faster than any UI needs to redraw --
    // cache the latest value above and push it to listeners at a fixed, gentle rate.
    setInterval(() => {
      if (this.atem.status === AtemLibStatus.CONNECTED) {
        this.emit('master-level-changed', this.latestMasterLevel)
        this.emit(
          'source-levels-changed',
          Array.from(this.latestSourceLevels.entries())
            .filter(([index]) => this.isVideoAudioInput(index))
            .map(([index, level]) => ({ index, ...level }))
            .sort((a, b) => a.index - b.index)
        )
      }
    }, AUDIO_LEVEL_EMIT_INTERVAL_MS)

    // Re-assert the "send levels" subscription periodically -- another connected
    // client (e.g. ATEM Software Control) toggling its own audio page can override
    // this flag, and a single request on connect isn't enough to guarantee it stays on.
    setInterval(() => {
      if (this.atem.status === AtemLibStatus.CONNECTED) {
        this.atem.startFairlightMixerSendLevels().catch(() => {})
      }
    }, 2000)
  }

  // atem-connection keeps its last-known state after a disconnect, so every
  // getter must gate on this rather than on `state` being present.
  private get isConnected(): boolean {
    return this.atem.status === AtemLibStatus.CONNECTED
  }

  getStatus(): AtemConnectionStatus {
    const connected = this.isConnected
    return {
      connected,
      connecting: this.atem.status === AtemLibStatus.CONNECTING,
      ip: this.ip,
      error: this.error,
      deviceInfo: this.getDeviceInfo(),
      programInput: connected ? (this.atem.state?.video.mixEffects[0]?.programInput ?? null) : null
    }
  }

  getDeviceInfo(): AtemDeviceInfo | null {
    if (!this.isConnected) return null
    const info = this.atem.state?.info
    if (!info) return null

    const currentModeId = this.atem.state?.settings.videoMode
    const currentVideoMode: AtemVideoModeInfo | null =
      currentModeId !== undefined ? { id: currentModeId, name: videoModeName(currentModeId) } : null
    const supportedVideoModes: AtemVideoModeInfo[] = (info.supportedVideoModes ?? []).map((m) => ({
      id: m.mode,
      name: videoModeName(m.mode)
    }))

    return {
      model: modelName(info.model),
      modelId: info.model,
      isIsoCapable: isIsoCapableModel(info.model),
      protocolVersion: protocolVersionName(info.apiVersion),
      productIdentifier: info.productIdentifier ?? null,
      capabilities: info.capabilities
        ? {
            mixEffects: info.capabilities.mixEffects,
            sources: info.capabilities.sources,
            downstreamKeyers: info.capabilities.downstreamKeyers,
            mediaPlayers: info.capabilities.mediaPlayers,
            auxiliaries: info.capabilities.auxilliaries,
            superSources: info.capabilities.superSources
          }
        : null,
      multiviewerCount: info.multiviewer?.count ?? null,
      mediaPoolStills: info.mediaPool?.stillCount ?? null,
      mediaPoolClips: info.mediaPool?.clipCount ?? null,
      currentVideoMode,
      supportedVideoModes
    }
  }

  private emitStatus(): void {
    this.emit('status-changed', this.getStatus())
  }

  async connect(ip: string): Promise<void> {
    await this.disconnect()
    this.ip = ip
    this.error = null
    this.emitStatus()
    try {
      await this.atem.connect(ip)
    } catch (err) {
      this.error = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      this.emitStatus()
    }
  }

  async disconnect(): Promise<void> {
    await this.atem.disconnect()
    this.ip = null
    this.emitStatus()
  }

  getInputs(): AtemInputInfo[] {
    if (!this.isConnected) return []
    const inputs = this.atem.state?.inputs ?? {}
    return Object.values(inputs)
      .filter((input): input is NonNullable<typeof input> => input != null)
      .map((input) => ({ id: input.inputId, name: input.longName || input.shortName || `Input ${input.inputId}` }))
      .sort((a, b) => a.id - b.id)
  }

  async cutToInput(input: number, mixEffect = 0): Promise<void> {
    await this.atem.changeProgramInput(input, mixEffect)
  }

  getRecordingStatus(): AtemRecordingStatus {
    const recording = this.isConnected ? this.atem.state?.recording : undefined
    const disks: AtemRecordingDiskInfo[] = Object.values(recording?.disks ?? {})
      .filter((disk): disk is NonNullable<typeof disk> => disk != null)
      .map((disk) => ({
        id: disk.diskId,
        volumeName: disk.volumeName,
        status: diskStatusToString(disk.status),
        recordingTimeAvailableSeconds: disk.recordingTimeAvailable
      }))
      .sort((a, b) => a.id - b.id)

    const duration = recording?.duration
    return {
      recording: recording?.status?.state === Enums.RecordingStatus.Recording,
      stopping: recording?.status?.state === Enums.RecordingStatus.Stopping,
      durationSeconds: duration ? duration.hours * 3600 + duration.minutes * 60 + duration.seconds : null,
      disks,
      filename: recording?.properties?.filename ?? '',
      // `recordAllInputs` is the ISO-recording toggle (RecordingISOCommand / 'ISOi'), distinct from
      // `properties.recordInAllCameras` which is the unrelated "record in all cameras" camera-trigger setting.
      recordAllInputs: recording?.recordAllInputs ?? false
    }
  }

  async startRecording(): Promise<void> {
    await this.atem.startRecording()
  }

  async stopRecording(): Promise<void> {
    await this.atem.stopRecording()
  }

  async setRecordingFilename(filename: string): Promise<void> {
    await this.atem.setRecordingSettings({ filename })
  }

  async setRecordAllInputs(enabled: boolean): Promise<void> {
    await this.atem.setEnableISORecording(enabled)
  }

  async setVideoMode(mode: number): Promise<void> {
    await this.atem.sendCommand(new Commands.VideoModeCommand(mode))
  }

  private isVideoAudioInput(index: number): boolean {
    const inputType = this.atem.state?.fairlight?.inputs[index]?.properties?.inputType
    return inputType === Enums.FairlightInputType.EmbeddedWithVideo
  }

  getAudioChannels(): AtemAudioChannelInfo[] {
    if (!this.isConnected) return []
    const inputs = this.atem.state?.fairlight?.inputs ?? {}
    return Object.entries(inputs)
      .filter(([key, input]) => input != null && this.isVideoAudioInput(Number(key)))
      .map(([key, input]) => {
        const sourceId = Object.keys(input!.sources)[0]
        const props = sourceId ? input!.sources[sourceId]?.properties : undefined
        return {
          index: Number(key),
          gainDb: (props?.gain ?? 0) / 100,
          on: props?.mixOption === Enums.FairlightAudioMixOption.On
        }
      })
      .sort((a, b) => a.index - b.index)
  }

  async setAudioChannelGain(index: number, gainDb: number): Promise<void> {
    const input = this.atem.state?.fairlight?.inputs[index]
    const sourceId = input ? Object.keys(input.sources)[0] : undefined
    if (!sourceId) return
    await this.atem.setFairlightAudioMixerSourceProps(index, sourceId, { gain: Math.round(gainDb * 100) })
  }

  /**
   * Manual "solo" selection: sets exactly one Fairlight channel's mixOption to
   * On and every other channel's to Off, so only that input's audio reaches
   * the master bus regardless of which video input the switcher is cutting
   * to. This is distinct from Audio Follow Video and isn't MIDI-controlled --
   * it's a fixed manual override the user sets from this panel.
   */
  async selectSoloAudioChannel(index: number): Promise<void> {
    const inputs = this.atem.state?.fairlight?.inputs ?? {}
    await Promise.all(
      Object.entries(inputs)
        .filter(([, input]) => input != null)
        .map(([key, input]) => {
          const channelIndex = Number(key)
          const sourceId = Object.keys(input!.sources)[0]
          if (!sourceId) return Promise.resolve()
          const mixOption =
            channelIndex === index ? Enums.FairlightAudioMixOption.On : Enums.FairlightAudioMixOption.Off
          return this.atem.setFairlightAudioMixerSourceProps(channelIndex, sourceId, { mixOption })
        })
    )
  }
}
