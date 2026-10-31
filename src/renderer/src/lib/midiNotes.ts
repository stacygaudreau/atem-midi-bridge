const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

/** Cubase's default convention: middle C (note 60) is C3. */
export function cubaseNoteName(note: number): string {
  const pitch = NOTE_NAMES[note % 12]
  const octave = Math.floor(note / 12) - 2
  return `${pitch}${octave}`
}
