# ATEM MIDI Bridge

> **Notice:** This is not an official Blackmagic Design app. It is not affiliated with or endorsed by Blackmagic Design. Blackmagic, Blackmagic Design and ATEM are trademarks of Blackmagic Design Pty. Ltd., property of their respective owners, and are used here without permission.

Desktop app that lets you switch ATEM video inputs from MIDI notes sent by a DAW (e.g. Cubase), for easy beat-synced camera switching. This was built to easily create video content to go along with your musical productions. Also provides recording control and audio monitoring to/from the ATEM device.

## Usage

Kept deliberately simple and focused, with the ATEM controls that matter for music video work on one screen:

- **Video:** each MIDI note cuts to a camera. Program MIDI notes in your DAW, and the video switches accordingly.
- **Audio:** pick one audio source on the ATEM (e.g. your DAW's mix) and it stays the only source in the recording, no matter which camera is live.
- **Recording:** start/stop, filename, disks, ISO and video format, without opening ATEM Software Control.
- Every section collapses to a compact one-line view.
- ATEM is autodiscovered on network (in Windows, make sure your network type is `PRIVATE` (not public) or auto discover might not work), or you can set an IP address manually to connect

## MIDI setup

The app listens on a MIDI input port. It can't create a virtual port itself yet (may be added later), so for a DAW on the same computer you currently need one:

- **Windows:** install [loopMIDI](https://www.tobias-erichsen.de/software/loopmidi.html) and create a port.
- **macOS:** enable the IAC Driver in Audio MIDI Setup.

Send your DAW's MIDI track to that port, then select it in the app's **MIDI** tab and map notes to inputs.

## Requirements

- Node.js 22.12+ and npm
- ATEM on the same network as the computer (ATEM over USB connection not supported)

## Development

1. `npm install`
2. `npm run dev`

Typecheck: `npm run typecheck`

## Build

1. `npm install`
2. `npm run build`
3. `npm start` (runs the built app)

## Troubleshooting

- **ATEM not discovered (Windows):** set the network profile to *Private* and allow the app through Windows Firewall on first launch. You can also enter the IP manually.
- **Native Electron module install fails:** prebuilt binaries cover Windows, macOS and Linux (x64/ARM). Otherwise a compiler toolchain is needed (Python + VS Build Tools / Xcode CLI tools / `build-essential`; Linux also `libasound2-dev`).
- **Electron download fails behind a proxy:** set `ELECTRON_MIRROR`.

## License

[MIT](LICENSE)
