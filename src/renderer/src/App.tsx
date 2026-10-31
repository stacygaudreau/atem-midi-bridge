import { useCallback, useEffect, useState } from 'react'
import { Clapperboard } from 'lucide-react'
import type {
  AtemAudioChannelInfo,
  AtemAudioLevel,
  AtemAudioSourceLevel,
  AtemConnectionStatus,
  AtemInputInfo,
  AtemRecordingStatus,
  Mapping,
  MappingTriggeredEvent,
  MidiActivityEvent,
  MidiConnectionStatus,
  NewMapping
} from '@shared/types'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@renderer/components/ui/tabs'
import { MidiConnectionCard } from '@renderer/components/MidiConnectionCard'
import { AtemConnectionCard } from '@renderer/components/AtemConnectionCard'
import { MappingTable } from '@renderer/components/MappingTable'
import { MappingDialog } from '@renderer/components/MappingDialog'
import { ActivityLog } from '@renderer/components/ActivityLog'
import { StatusBar } from '@renderer/components/StatusBar'
import { MappingOverview } from '@renderer/components/MappingOverview'
import { DeviceInfoPanel } from '@renderer/components/DeviceInfoPanel'
import { VideoModeCard } from '@renderer/components/VideoModeCard'
import { RecordingControlCard } from '@renderer/components/RecordingControlCard'
import { AudioSection } from '@renderer/components/AudioSection'
import { Footer } from '@renderer/components/Footer'

const MAX_LOG_ENTRIES = 50

const EMPTY_RECORDING_STATUS: AtemRecordingStatus = {
  recording: false,
  stopping: false,
  durationSeconds: null,
  disks: [],
  filename: '',
  recordAllInputs: false
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [appVersion, setAppVersion] = useState<string | null>(null)

  const [midiPorts, setMidiPorts] = useState<string[]>([])
  const [selectedMidiPort, setSelectedMidiPort] = useState<string | null>(null)
  const [midiStatus, setMidiStatus] = useState<MidiConnectionStatus>({
    connected: false,
    portName: null,
    error: null
  })
  const [lastMidiActivity, setLastMidiActivity] = useState<MidiActivityEvent | null>(null)

  const [atemIpInput, setAtemIpInput] = useState('')
  const [atemStatus, setAtemStatus] = useState<AtemConnectionStatus>({
    connected: false,
    connecting: false,
    ip: null,
    error: null,
    deviceInfo: null,
    programInput: null
  })
  const [atemInputs, setAtemInputs] = useState<AtemInputInfo[]>([])
  const [recordingStatus, setRecordingStatus] = useState<AtemRecordingStatus>(EMPTY_RECORDING_STATUS)
  const [recordingBusy, setRecordingBusy] = useState(false)
  const [masterLevel, setMasterLevel] = useState<AtemAudioLevel | null>(null)
  const [sourceLevels, setSourceLevels] = useState<AtemAudioSourceLevel[]>([])
  const [audioChannels, setAudioChannels] = useState<AtemAudioChannelInfo[]>([])

  const [mappings, setMappings] = useState<Mapping[]>([])
  const [triggered, setTriggered] = useState<MappingTriggeredEvent[]>([])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMapping, setEditingMapping] = useState<Mapping | null>(null)

  const refreshMidiPorts = useCallback((): void => {
    void window.api.midi.listPorts().then(setMidiPorts)
  }, [])

  useEffect(() => {
    void window.api.app.getVersion().then(setAppVersion)
    void window.api.midi.listPorts().then(setMidiPorts)
    void window.api.midi.getStatus().then((status) => {
      setMidiStatus(status)
      setSelectedMidiPort(status.portName)
    })
    void window.api.atem.getStatus().then((status) => {
      setAtemStatus(status)
      if (status.ip) setAtemIpInput(status.ip)
    })
    void window.api.atem.getInputs().then(setAtemInputs)
    void window.api.atem.getRecordingStatus().then(setRecordingStatus)
    void window.api.atem.getAudioChannels().then(setAudioChannels)
    void window.api.mappings.get().then(setMappings)

    const unsubMidiStatus = window.api.midi.onStatusChanged((status) => {
      setMidiStatus(status)
      setSelectedMidiPort(status.portName)
    })
    const unsubMidiActivity = window.api.midi.onActivity(setLastMidiActivity)
    const unsubAtemStatus = window.api.atem.onStatusChanged((status) => {
      setAtemStatus(status)
      if (status.connected) {
        void window.api.atem.getInputs().then(setAtemInputs)
        void window.api.atem.getAudioChannels().then(setAudioChannels)
      }
    })
    const unsubRecording = window.api.atem.onRecordingChanged(setRecordingStatus)
    const unsubMasterLevel = window.api.atem.onMasterLevelChanged(setMasterLevel)
    const unsubSourceLevels = window.api.atem.onSourceLevelsChanged(setSourceLevels)
    const unsubAudioChannels = window.api.atem.onAudioChannelsChanged(setAudioChannels)
    const unsubTriggered = window.api.mappings.onTriggered((event) => {
      setTriggered((prev) => [event, ...prev].slice(0, MAX_LOG_ENTRIES))
    })

    return () => {
      unsubMidiStatus()
      unsubMidiActivity()
      unsubAtemStatus()
      unsubRecording()
      unsubMasterLevel()
      unsubSourceLevels()
      unsubAudioChannels()
      unsubTriggered()
    }
  }, [])

  function handleSelectMidiPort(port: string | null): void {
    setSelectedMidiPort(port)
    void window.api.midi.selectPort(port)
  }

  function handleConnectAtem(): void {
    void window.api.atem.connect(atemIpInput.trim())
  }

  function handleDisconnectAtem(): void {
    void window.api.atem.disconnect()
  }

  function handleStartRecording(): void {
    setRecordingBusy(true)
    void window.api.atem.startRecording().finally(() => setRecordingBusy(false))
  }

  function handleStopRecording(): void {
    setRecordingBusy(true)
    void window.api.atem.stopRecording().finally(() => setRecordingBusy(false))
  }

  function handleSetFilename(filename: string): void {
    void window.api.atem.setRecordingFilename(filename)
  }

  function handleSetRecordAllInputs(enabled: boolean): void {
    void window.api.atem.setRecordAllInputs(enabled)
  }

  function handleSetVideoMode(mode: number): void {
    void window.api.atem.setVideoMode(mode)
  }

  function handleManualCut(input: number): void {
    void window.api.atem.cut(input)
  }

  function handleSetAudioChannelGain(index: number, gainDb: number): void {
    void window.api.atem.setAudioChannelGain(index, gainDb)
  }

  function handleSelectSoloAudioChannel(index: number): void {
    void window.api.atem.selectSoloAudioChannel(index)
  }

  function openAddDialog(): void {
    setEditingMapping(null)
    setDialogOpen(true)
  }

  function openEditDialog(mapping: Mapping): void {
    setEditingMapping(mapping)
    setDialogOpen(true)
  }

  function handleSaveMapping(payload: Mapping | NewMapping, id: string | null): void {
    if (id) {
      void window.api.mappings.update(payload as Mapping).then(setMappings)
    } else {
      void window.api.mappings.add(payload as NewMapping).then(setMappings)
    }
  }

  function handleRemoveMapping(id: string): void {
    void window.api.mappings.remove(id).then(setMappings)
  }

  function handleToggleMapping(id: string, enabled: boolean): void {
    void window.api.mappings.setEnabled(id, enabled).then(setMappings)
  }

  return (
    <div className="mx-auto flex h-screen max-w-5xl flex-col gap-4 overflow-hidden p-6">
      <header className="flex shrink-0 items-center gap-2.5">
        <Clapperboard className="size-5 text-primary" />
        <h1 className="text-base font-semibold">ATEM MIDI Bridge</h1>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col gap-4">
        <TabsList className="shrink-0">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="atem">ATEM</TabsTrigger>
          <TabsTrigger value="settings">MIDI</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-0 flex min-h-0 flex-1 flex-col gap-4">
          <div className="shrink-0">
            <StatusBar
              midiStatus={midiStatus}
              atemStatus={atemStatus}
              onNavigateAtem={() => setActiveTab('atem')}
              onNavigateMidi={() => setActiveTab('settings')}
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
            <RecordingControlCard
              atemStatus={atemStatus}
              recordingStatus={recordingStatus}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              recordingBusy={recordingBusy}
              onSetFilename={handleSetFilename}
              onSetRecordAllInputs={handleSetRecordAllInputs}
              onSetVideoMode={handleSetVideoMode}
            />

            <MappingOverview
              mappings={mappings}
              atemInputs={atemInputs}
              currentProgramInput={atemStatus.programInput}
              atemConnected={atemStatus.connected}
              onSelectInput={handleManualCut}
              onManage={() => setActiveTab('settings')}
            />

            <AudioSection
              atemStatus={atemStatus}
              masterLevel={masterLevel}
              sourceLevels={sourceLevels}
              audioChannels={audioChannels}
              onSetChannelGain={handleSetAudioChannelGain}
              onSelectSoloChannel={handleSelectSoloAudioChannel}
            />

            <ActivityLog triggered={triggered} lastMidiActivity={lastMidiActivity} />
          </div>
        </TabsContent>

        <TabsContent value="atem" className="mt-0 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          <AtemConnectionCard
            atemIpInput={atemIpInput}
            onAtemIpInputChange={setAtemIpInput}
            atemStatus={atemStatus}
            onConnectAtem={handleConnectAtem}
            onDisconnectAtem={handleDisconnectAtem}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DeviceInfoPanel atemStatus={atemStatus} />
            <VideoModeCard atemStatus={atemStatus} onSetVideoMode={handleSetVideoMode} />
          </div>

          <RecordingControlCard
            atemStatus={atemStatus}
            recordingStatus={recordingStatus}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            recordingBusy={recordingBusy}
            onSetFilename={handleSetFilename}
            onSetRecordAllInputs={handleSetRecordAllInputs}
            onSetVideoMode={handleSetVideoMode}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-0 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          <MidiConnectionCard
            midiPorts={midiPorts}
            selectedMidiPort={selectedMidiPort}
            midiStatus={midiStatus}
            onSelectMidiPort={handleSelectMidiPort}
            onRefreshMidiPorts={refreshMidiPorts}
          />

          <MappingTable
            mappings={mappings}
            atemInputs={atemInputs}
            onAdd={openAddDialog}
            onEdit={openEditDialog}
            onRemove={handleRemoveMapping}
            onToggle={handleToggleMapping}
          />
        </TabsContent>
      </Tabs>

      <Footer version={appVersion} />

      <MappingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mapping={editingMapping}
        atemInputs={atemInputs}
        onSave={handleSaveMapping}
      />
    </div>
  )
}
