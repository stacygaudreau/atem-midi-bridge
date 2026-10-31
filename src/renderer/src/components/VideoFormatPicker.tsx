import { useEffect, useState } from 'react'
import type { AtemDeviceInfo } from '@shared/types'
import { Button } from '@renderer/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@renderer/components/ui/select'

interface VideoFormatPickerProps {
  id: string
  info: AtemDeviceInfo
  disabled?: boolean
  onSetVideoMode: (mode: number) => void
}

export function VideoFormatPicker({ id, info, disabled, onSetVideoMode }: VideoFormatPickerProps) {
  const [selected, setSelected] = useState('')

  useEffect(() => {
    if (info.currentVideoMode) setSelected(String(info.currentVideoMode.id))
  }, [info.currentVideoMode?.id])

  function handleSet(): void {
    if (!selected) return
    const mode = Number(selected)
    const name = info.supportedVideoModes.find((m) => m.id === mode)?.name ?? selected
    const confirmed = window.confirm(
      `Change the switcher's video standard to ${name}? This may briefly interrupt program output.`
    )
    if (confirmed) onSetVideoMode(mode)
  }

  const unchanged = selected === String(info.currentVideoMode?.id ?? '')

  return (
    <div className="flex items-center gap-2">
      <Select value={selected} onValueChange={setSelected} disabled={disabled}>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Select a video standard" />
        </SelectTrigger>
        <SelectContent>
          {info.supportedVideoModes.map((mode) => (
            <SelectItem key={mode.id} value={String(mode.id)}>
              {mode.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleSet} disabled={disabled || !selected || unchanged}>
        Set
      </Button>
    </div>
  )
}
