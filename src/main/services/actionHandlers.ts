import type { AtemAction } from '@shared/types'
import type { AtemService } from './atemService'

type ActionHandler<T extends AtemAction> = (atem: AtemService, action: T) => Promise<void>

/**
 * One handler per AtemAction variant. Adding a new action kind (autoTransition,
 * setDsk, ...) means adding a union member to AtemActionSchema and a key here --
 * MappingEngine's dispatch loop doesn't need to change.
 */
export const actionHandlers: { [K in AtemAction['type']]: ActionHandler<Extract<AtemAction, { type: K }>> } = {
  cut: async (atem, action) => {
    await atem.cutToInput(action.input)
  }
}
