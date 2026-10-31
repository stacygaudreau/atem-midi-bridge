import { useEffect, useState, type FormEvent } from 'react'
import type { AtemInputInfo, Mapping, NewMapping } from '@shared/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@renderer/components/ui/select'
import { Radio } from 'lucide-react'

interface MappingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mapping: Mapping | null
  atemInputs: AtemInputInfo[]
  onSave: (mapping: Mapping | NewMapping, id: string | null) => void
}

export function MappingDialog({ open, onOpenChange, mapping, atemInputs, onSave }: MappingDialogProps) {
  const [label, setLabel] = useState('')
  const [note, setNote] = useState('60')
  const [channel, setChannel] = useState<string>('any')
  const [inputId, setInputId] = useState('1')
  const [listening, setListening] = useState(false)

  useEffect(() => {
    if (!open) {
      setListening(false)
      return
    }
    setLabel(mapping?.label ?? '')
    setNote(String(mapping?.trigger.note ?? 60))
    setChannel(mapping ? String(mapping.trigger.channel) : 'any')
    setInputId(String(mapping?.action.input ?? 1))
  }, [open, mapping])

  useEffect(() => {
    if (!listening) return
    const unsubscribe = window.api.midi.onActivity((event) => {
      if (event.type !== 'noteon') return
      setNote(String(event.note))
      setChannel(String(event.channel))
      setListening(false)
    })
    return unsubscribe
  }, [listening])

  function handleSubmit(e: FormEvent): void {
    e.preventDefault()
    const noteNumber = Number(note)
    const inputNumber = Number(inputId)
    if (!Number.isInteger(noteNumber) || noteNumber < 0 || noteNumber > 127) return
    if (!Number.isInteger(inputNumber) || inputNumber < 1) return

    const base: NewMapping = {
      label: label.trim() || undefined,
      enabled: mapping?.enabled ?? true,
      trigger: {
        type: 'noteon',
        note: noteNumber,
        channel: channel === 'any' ? 'any' : Number(channel)
      },
      action: { type: 'cut', input: inputNumber }
    }
    const payload: Mapping | NewMapping = mapping ? { ...base, id: mapping.id } : base

    onSave(payload, mapping?.id ?? null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{mapping ? 'Edit mapping' : 'Add mapping'}</DialogTitle>
            <DialogDescription>
              Trigger a hard cut to an ATEM input when this MIDI note is received.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="label">Label (optional)</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Wide shot"
              />
            </div>

            <div className="flex items-end gap-2">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="note">MIDI note number (0-127)</Label>
                <Input
                  id="note"
                  type="number"
                  min={0}
                  max={127}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  required
                />
              </div>
              <Button
                type="button"
                variant={listening ? 'destructive' : 'outline'}
                onClick={() => setListening((v) => !v)}
              >
                <Radio className="size-4" />
                {listening ? 'Listening…' : 'Listen'}
              </Button>
            </div>
            <p className="-mt-2 text-xs text-muted-foreground">
              Octave naming (C3 vs C4) varies by DAW — use the raw note number shown in Cubase's
              piano roll, or click Listen and play the note.
            </p>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="channel">MIDI channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger id="channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any channel</SelectItem>
                  {Array.from({ length: 16 }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>
                      Channel {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="input">ATEM input (hard cut target)</Label>
              <Select value={inputId} onValueChange={setInputId}>
                <SelectTrigger id="input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {atemInputs.length > 0
                    ? atemInputs.map((input) => (
                        <SelectItem key={input.id} value={String(input.id)}>
                          {input.id} · {input.name}
                        </SelectItem>
                      ))
                    : Array.from({ length: 8 }, (_, i) => i + 1).map((id) => (
                        <SelectItem key={id} value={String(id)}>
                          Input {id}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
              {atemInputs.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Connect to the ATEM to see real input names.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
