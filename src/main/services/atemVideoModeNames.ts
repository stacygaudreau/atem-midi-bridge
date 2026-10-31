import { Enums } from 'atem-connection'

const VIDEO_MODE_NAMES: Record<Enums.VideoMode, string> = {
  [Enums.VideoMode.N525i5994NTSC]: '525i59.94 NTSC',
  [Enums.VideoMode.P625i50PAL]: '625i50 PAL',
  [Enums.VideoMode.N525i5994169]: '525i59.94 NTSC 16:9',
  [Enums.VideoMode.P625i50169]: '625i50 PAL 16:9',
  [Enums.VideoMode.P720p50]: '720p50',
  [Enums.VideoMode.N720p5994]: '720p59.94',
  [Enums.VideoMode.P1080i50]: '1080i50',
  [Enums.VideoMode.N1080i5994]: '1080i59.94',
  [Enums.VideoMode.N1080p2398]: '1080p23.98',
  [Enums.VideoMode.N1080p24]: '1080p24',
  [Enums.VideoMode.P1080p25]: '1080p25',
  [Enums.VideoMode.N1080p2997]: '1080p29.97',
  [Enums.VideoMode.P1080p50]: '1080p50',
  [Enums.VideoMode.N1080p5994]: '1080p59.94',
  [Enums.VideoMode.N4KHDp2398]: '4K HD p23.98',
  [Enums.VideoMode.N4KHDp24]: '4K HD p24',
  [Enums.VideoMode.P4KHDp25]: '4K HD p25',
  [Enums.VideoMode.N4KHDp2997]: '4K HD p29.97',
  [Enums.VideoMode.P4KHDp5000]: '4K HD p50',
  [Enums.VideoMode.N4KHDp5994]: '4K HD p59.94',
  [Enums.VideoMode.N8KHDp2398]: '8K HD p23.98',
  [Enums.VideoMode.N8KHDp24]: '8K HD p24',
  [Enums.VideoMode.P8KHDp25]: '8K HD p25',
  [Enums.VideoMode.N8KHDp2997]: '8K HD p29.97',
  [Enums.VideoMode.P8KHDp50]: '8K HD p50',
  [Enums.VideoMode.N8KHDp5994]: '8K HD p59.94',
  [Enums.VideoMode.N1080p30]: '1080p30',
  [Enums.VideoMode.N1080p60]: '1080p60'
}

export function videoModeName(mode: Enums.VideoMode): string {
  return VIDEO_MODE_NAMES[mode] ?? `Unknown (${mode})`
}
