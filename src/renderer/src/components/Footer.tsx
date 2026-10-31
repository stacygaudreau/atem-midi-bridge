interface FooterProps {
  version: string | null
}

export function Footer({ version }: FooterProps) {
  return (
    <div className="shrink-0 pt-1 text-center text-[11px] text-muted-foreground">
      <span>ATEM MIDI Bridge App</span>
      {version && (
        <>
          <span className="px-1.5">|</span>
          <span>v{version}</span>
        </>
      )}
      <span className="px-1.5">|</span>
      <a
        href="https://github.com/stacygaudreau"
        target="_blank"
        rel="noreferrer"
        className="hover:text-foreground hover:underline"
      >
        Stacy Gaudreau
      </a>
      <span className="px-1.5">|</span>
      <a
        href="https://github.com/stacygaudreau/atem-midi-bridge/issues"
        target="_blank"
        rel="noreferrer"
        className="hover:text-foreground hover:underline"
      >
        Issues/Feature requests
      </a>
    </div>
  )
}
