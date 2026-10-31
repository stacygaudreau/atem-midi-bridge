import { app, ipcMain, type BrowserWindow } from 'electron'
import { IpcInvoke, IpcEvent } from '@shared/ipc'
import { NewMappingSchema, MappingSchema } from '@shared/types'
import type { MidiService } from '../services/midiService'
import type { AtemService } from '../services/atemService'
import type { AtemDiscoveryService } from '../services/atemDiscoveryService'
import type { SettingsStore } from '../services/settingsStore'
import type { MappingEngine } from '../services/mappingEngine'

interface Services {
  midi: MidiService
  atem: AtemService
  atemDiscovery: AtemDiscoveryService
  settings: SettingsStore
  mappingEngine: MappingEngine
}

export function registerIpcHandlers(window: BrowserWindow, services: Services): void {
  const { midi, atem, atemDiscovery, settings, mappingEngine } = services

  const send = (channel: string, payload: unknown): void => {
    if (!window.isDestroyed()) window.webContents.send(channel, payload)
  }

  ipcMain.handle(IpcInvoke.AppGetVersion, () => app.getVersion())

  ipcMain.handle(IpcInvoke.MidiListPorts, () => midi.listPorts())
  ipcMain.handle(IpcInvoke.MidiSelectPort, (_event, portName: string | null) => {
    settings.setMidiPortName(portName)
    midi.selectPort(portName)
  })
  ipcMain.handle(IpcInvoke.MidiGetStatus, () => midi.getStatus())

  ipcMain.handle(IpcInvoke.AtemConnect, async (_event, ip: string) => {
    settings.setAtemIp(ip)
    await atem.connect(ip)
  })
  ipcMain.handle(IpcInvoke.AtemDisconnect, async () => {
    settings.setAtemIp(null)
    await atem.disconnect()
  })
  ipcMain.handle(IpcInvoke.AtemGetStatus, () => atem.getStatus())
  ipcMain.handle(IpcInvoke.AtemGetInputs, () => atem.getInputs())
  ipcMain.handle(IpcInvoke.AtemCut, (_event, input: number) => atem.cutToInput(input))
  ipcMain.handle(IpcInvoke.AtemGetRecordingStatus, () => atem.getRecordingStatus())
  ipcMain.handle(IpcInvoke.AtemStartRecording, () => atem.startRecording())
  ipcMain.handle(IpcInvoke.AtemStopRecording, () => atem.stopRecording())
  ipcMain.handle(IpcInvoke.AtemSetRecordingFilename, (_event, filename: string) =>
    atem.setRecordingFilename(filename)
  )
  ipcMain.handle(IpcInvoke.AtemSetRecordAllInputs, (_event, enabled: boolean) => atem.setRecordAllInputs(enabled))
  ipcMain.handle(IpcInvoke.AtemSetVideoMode, (_event, mode: number) => atem.setVideoMode(mode))
  ipcMain.handle(IpcInvoke.AtemDiscoveryStart, () => atemDiscovery.start())
  ipcMain.handle(IpcInvoke.AtemDiscoveryGetDevices, () => atemDiscovery.getDevices())
  ipcMain.handle(IpcInvoke.AtemDiscoveryRefresh, () => atemDiscovery.refresh())
  ipcMain.handle(IpcInvoke.AtemGetAudioChannels, () => atem.getAudioChannels())
  ipcMain.handle(IpcInvoke.AtemSetAudioChannelGain, (_event, index: number, gainDb: number) =>
    atem.setAudioChannelGain(index, gainDb)
  )
  ipcMain.handle(IpcInvoke.AtemSelectSoloAudioChannel, (_event, index: number) =>
    atem.selectSoloAudioChannel(index)
  )

  ipcMain.handle(IpcInvoke.MappingsGet, () => settings.getMappings())
  ipcMain.handle(IpcInvoke.MappingsAdd, (_event, mapping: unknown) =>
    settings.addMapping(NewMappingSchema.parse(mapping))
  )
  ipcMain.handle(IpcInvoke.MappingsUpdate, (_event, mapping: unknown) =>
    settings.updateMapping(MappingSchema.parse(mapping))
  )
  ipcMain.handle(IpcInvoke.MappingsRemove, (_event, id: string) => settings.removeMapping(id))
  ipcMain.handle(IpcInvoke.MappingsSetEnabled, (_event, id: string, enabled: boolean) =>
    settings.setMappingEnabled(id, enabled)
  )

  midi.on('status-changed', (status) => send(IpcEvent.MidiStatusChanged, status))
  midi.on('activity', (event) => send(IpcEvent.MidiActivity, event))
  atem.on('status-changed', (status) => send(IpcEvent.AtemStatusChanged, status))
  atem.on('master-level-changed', (level) => send(IpcEvent.AtemMasterLevelChanged, level))
  atem.on('source-levels-changed', (levels) => send(IpcEvent.AtemSourceLevelsChanged, levels))
  atem.on('audio-channels-changed', (channels) => send(IpcEvent.AtemAudioChannelsChanged, channels))
  atem.on('recording-changed', (status) => send(IpcEvent.AtemRecordingChanged, status))
  atemDiscovery.on('updated', (devices) => send(IpcEvent.AtemDiscoveryUpdated, devices))
  mappingEngine.on('triggered', (event) => send(IpcEvent.MappingTriggered, event))
}
