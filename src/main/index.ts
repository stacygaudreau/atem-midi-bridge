import { app, BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { MidiService } from './services/midiService'
import { AtemService } from './services/atemService'
import { AtemDiscoveryService } from './services/atemDiscoveryService'
import { SettingsStore } from './services/settingsStore'
import { MappingEngine } from './services/mappingEngine'
import { registerIpcHandlers } from './ipc/registerIpcHandlers'

const settings = new SettingsStore()
const midi = new MidiService()
const atem = new AtemService()
const atemDiscovery = new AtemDiscoveryService()
const mappingEngine = new MappingEngine(midi, atem, settings)

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 860,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(import.meta.dirname, '../preload/index.mjs'),
      sandbox: false
    }
  })

  window.once('ready-to-show', () => window.show())

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      void shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  registerIpcHandlers(window, { midi, atem, atemDiscovery, settings, mappingEngine })

  if (process.env.ELECTRON_RENDERER_URL) {
    window.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    window.loadFile(join(import.meta.dirname, '../renderer/index.html'))
  }

  const savedPort = settings.getMidiPortName()
  if (savedPort && midi.listPorts().includes(savedPort)) {
    midi.selectPort(savedPort)
  }

  const savedIp = settings.getAtemIp()
  if (savedIp) {
    void atem.connect(savedIp)
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  midi.closePort()
  void atem.disconnect()
  app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
