import { Pencil, Plus, Trash2 } from 'lucide-react'
import type { AtemInputInfo, Mapping } from '@shared/types'
import { Button } from '@renderer/components/ui/button'
import { Switch } from '@renderer/components/ui/switch'
import { Badge } from '@renderer/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@renderer/components/ui/table'

interface MappingTableProps {
  mappings: Mapping[]
  atemInputs: AtemInputInfo[]
  onAdd: () => void
  onEdit: (mapping: Mapping) => void
  onRemove: (id: string) => void
  onToggle: (id: string, enabled: boolean) => void
}

export function MappingTable({ mappings, atemInputs, onAdd, onEdit, onRemove, onToggle }: MappingTableProps) {
  function inputName(id: number): string {
    return atemInputs.find((input) => input.id === id)?.name ?? `Input ${id}`
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Note → camera mappings</h2>
        <Button size="sm" onClick={onAdd}>
          <Plus className="size-4" />
          Add mapping
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Label</TableHead>
            <TableHead>MIDI note</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Action</TableHead>
            <TableHead className="w-20"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mappings.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                No mappings yet. Add one to get started.
              </TableCell>
            </TableRow>
          )}
          {mappings.map((mapping) => (
            <TableRow key={mapping.id} className={mapping.enabled ? '' : 'opacity-50'}>
              <TableCell>
                <Switch
                  checked={mapping.enabled}
                  onCheckedChange={(checked) => onToggle(mapping.id, checked)}
                />
              </TableCell>
              <TableCell className="font-medium">{mapping.label || '—'}</TableCell>
              <TableCell>
                <Badge variant="outline">Note {mapping.trigger.note}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {mapping.trigger.channel === 'any' ? 'Any' : mapping.trigger.channel + 1}
              </TableCell>
              <TableCell>
                Cut → {mapping.action.input} · {inputName(mapping.action.input)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(mapping)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onRemove(mapping.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
