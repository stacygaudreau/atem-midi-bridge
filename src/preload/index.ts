import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { IpcInvoke, IpcEvent } from '@shared/ipc'
import type {
  AtemAudioChannelInfo,
  AtemAudioLevel,
  AtemAudioSourceLevel,
  AtemConnectionStatus,
  AtemInputInfo,
  AtemRecordingStatus,
  DiscoveredAtem,
  Mapping,
  MappingTriggeredEvent,
  MidiActivityEvent,
  MidiConnectionStatus,
  NewMapping
} from '@shared/types'

function subscribe<T>(channel: string, callback: (payload: T) => void): () => void {
  const listener = (_event: IpcRendererEvent, payload: T): void => callback(payload)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

const api = {
  app: {
    getVersion: (): Promise<string> => ipcRenderer.invoke(IpcInvoke.AppGetVersion)
  },
  midi: {
    listPorts: (): Promise<string[]> => ipcRenderer.invoke(IpcInvoke.MidiListPorts),
    selectPort: (portName: string | null): Promise<void> =>
      ipcRenderer.invoke(IpcInvoke.MidiSelectPort, portName),
    getStatus: (): Promise<MidiConnectionStatus> => ipcRenderer.invoke(IpcInvoke.MidiGetStatus),
    onStatusChanged: (cb: (status: MidiConnectionStatus) => void) =>
      subscribe(IpcEvent.MidiStatusChanged, cb),
    onActivity: (cb: (event: MidiActivityEvent) => void) => subscribe(IpcEvent.MidiActivity, cb)
  },
  atem: {
    connect: (ip: string): Promise<void> => ipcRenderer.invoke(IpcInvoke.AtemConnect, ip),
    disconnect: (): Promise<void> => ipcRenderer.invoke(IpcInvoke.AtemDisconnect),
    getStatus: (): Promise<AtemConnectionStatus> => ipcRenderer.invoke(IpcInvoke.AtemGetStatus),
    getInputs: (): Promise<AtemInputInfo[]> => ipcRenderer.invoke(IpcInvoke.AtemGetInputs),
    cut: (input: number): Promise<void> => ipcRenderer.invoke(IpcInvoke.AtemCut, input),
    getRecordingStatus: (): Promise<AtemRecordingStatus> =>
      ipcRenderer.invoke(IpcInvoke.AtemGetRecordingStatus),
    startRecording: (): Promise<void> => ipcRenderer.invoke(IpcInvoke.AtemStartRecording),
    stopRecording: (): Promise<void> => ipcRenderer.invoke(IpcInvoke.AtemStopRecording),
    setRecordingFilename: (filename: string): Promise<void> =>
      ipcRenderer.invoke(IpcInvoke.AtemSetRecordingFilename, filename),
    setRecordAllInputs: (enabled: boolean): Promise<void> =>
      ipcRenderer.invoke(IpcInvoke.AtemSetRecordAllInputs, enabled),
    setVideoMode: (mode: number): Promise<void> => ipcRenderer.invoke(IpcInvoke.AtemSetVideoMode, mode),
    startDiscovery: (): Promise<void> => ipcRenderer.invoke(IpcInvoke.AtemDiscoveryStart),
    getDiscoveredDevices: (): Promise<DiscoveredAtem[]> =>
      ipcRenderer.invoke(IpcInvoke.AtemDiscoveryGetDevices),
    refreshDiscovery: (): Promise<void> => ipcRenderer.invoke(IpcInvoke.AtemDiscoveryRefresh),
    onStatusChanged: (cb: (status: AtemConnectionStatus) => void) =>
      subscribe(IpcEvent.AtemStatusChanged, cb),
    onRecordingChanged: (cb: (status: AtemRecordingStatus) => void) =>
      subscribe(IpcEvent.AtemRecordingChanged, cb),
    onDiscoveryUpdated: (cb: (devices: DiscoveredAtem[]) => void) =>
      subscribe(IpcEvent.AtemDiscoveryUpdated, cb),
    onMasterLevelChanged: (cb: (level: AtemAudioLevel | null) => void) =>
      subscribe(IpcEvent.AtemMasterLevelChanged, cb),
    onSourceLevelsChanged: (cb: (levels: AtemAudioSourceLevel[]) => void) =>
      subscribe(IpcEvent.AtemSourceLevelsChanged, cb),
    getAudioChannels: (): Promise<AtemAudioChannelInfo[]> => ipcRenderer.invoke(IpcInvoke.AtemGetAudioChannels),
    setAudioChannelGain: (index: number, gainDb: number): Promise<void> =>
      ipcRenderer.invoke(IpcInvoke.AtemSetAudioChannelGain, index, gainDb),
    onAudioChannelsChanged: (cb: (channels: AtemAudioChannelInfo[]) => void) =>
      subscribe(IpcEvent.AtemAudioChannelsChanged, cb),
    selectSoloAudioChannel: (index: number): Promise<void> =>
      ipcRenderer.invoke(IpcInvoke.AtemSelectSoloAudioChannel, index)
  },
  mappings: {
    get: (): Promise<Mapping[]> => ipcRenderer.invoke(IpcInvoke.MappingsGet),
    add: (mapping: NewMapping): Promise<Mapping[]> => ipcRenderer.invoke(IpcInvoke.MappingsAdd, mapping),
    update: (mapping: Mapping): Promise<Mapping[]> => ipcRenderer.invoke(IpcInvoke.MappingsUpdate, mapping),
    remove: (id: string): Promise<Mapping[]> => ipcRenderer.invoke(IpcInvoke.MappingsRemove, id),
    setEnabled: (id: string, enabled: boolean): Promise<Mapping[]> =>
      ipcRenderer.invoke(IpcInvoke.MappingsSetEnabled, id, enabled),
    onTriggered: (cb: (event: MappingTriggeredEvent) => void) => subscribe(IpcEvent.MappingTriggered, cb)
  }
}

export type Api = typeof api

contextBridge.exposeInMainWorld('api', api)
