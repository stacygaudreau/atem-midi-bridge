import { Enums } from 'atem-connection'

const MODEL_NAMES: Record<Enums.Model, string> = {
  [Enums.Model.Unknown]: 'Unknown',
  [Enums.Model.TVS]: 'ATEM Television Studio',
  [Enums.Model.OneME]: 'ATEM 1 M/E Production Studio',
  [Enums.Model.TwoME]: 'ATEM 2 M/E Production Studio',
  [Enums.Model.PS4K]: 'ATEM Production Studio 4K',
  [Enums.Model.OneME4K]: 'ATEM 1 M/E Production Studio 4K',
  [Enums.Model.TwoME4K]: 'ATEM 2 M/E Production Studio 4K',
  [Enums.Model.TwoMEBS4K]: 'ATEM 2 M/E Broadcast Studio 4K',
  [Enums.Model.TVSHD]: 'ATEM Television Studio HD',
  [Enums.Model.TVSProHD]: 'ATEM Television Studio Pro HD',
  [Enums.Model.TVSPro4K]: 'ATEM Television Studio Pro 4K',
  [Enums.Model.Constellation]: 'ATEM Constellation',
  [Enums.Model.Constellation8K]: 'ATEM Constellation 8K',
  [Enums.Model.Mini]: 'ATEM Mini',
  [Enums.Model.MiniPro]: 'ATEM Mini Pro',
  [Enums.Model.MiniProISO]: 'ATEM Mini Pro ISO',
  [Enums.Model.MiniExtreme]: 'ATEM Mini Extreme',
  [Enums.Model.MiniExtremeISO]: 'ATEM Mini Extreme ISO',
  [Enums.Model.ConstellationHD1ME]: 'ATEM Constellation HD1 M/E',
  [Enums.Model.ConstellationHD2ME]: 'ATEM Constellation HD2 M/E',
  [Enums.Model.ConstellationHD4ME]: 'ATEM Constellation HD4 M/E',
  [Enums.Model.SDI]: 'ATEM SDI',
  [Enums.Model.SDIProISO]: 'ATEM SDI Pro ISO',
  [Enums.Model.SDIExtremeISO]: 'ATEM SDI Extreme ISO',
  [Enums.Model.TelevisionStudioHD8]: 'ATEM Television Studio HD8',
  [Enums.Model.TelevisionStudioHD8ISO]: 'ATEM Television Studio HD8 ISO',
  [Enums.Model.Constellation4K1ME]: 'ATEM Constellation 4K1 M/E',
  [Enums.Model.Constellation4K2ME]: 'ATEM Constellation 4K2 M/E',
  [Enums.Model.Constellation4K4ME]: 'ATEM Constellation 4K4 M/E',
  [Enums.Model.Constellation4K4MEPlus]: 'ATEM Constellation 4K4 M/E Plus',
  [Enums.Model.TelevisionStudio4K8]: 'ATEM Television Studio 4K8',
  [Enums.Model.MiniExtremeISOG2]: 'ATEM Mini Extreme ISO G2'
}

export function modelName(model: Enums.Model): string {
  return MODEL_NAMES[model] ?? `Unknown model (${model})`
}

const PROTOCOL_VERSION_NAMES: Partial<Record<Enums.ProtocolVersion, string>> = {
  [Enums.ProtocolVersion.V7_2]: '7.2',
  [Enums.ProtocolVersion.V7_5_2]: '7.5.2',
  [Enums.ProtocolVersion.V8_0]: '8.0',
  [Enums.ProtocolVersion.V8_0_1]: '8.0.1',
  [Enums.ProtocolVersion.V8_1_1]: '8.1.1',
  [Enums.ProtocolVersion.V9_4]: '9.4',
  [Enums.ProtocolVersion.V9_6]: '9.6'
}

export function protocolVersionName(version: Enums.ProtocolVersion | undefined): string | null {
  if (version === undefined) return null
  return PROTOCOL_VERSION_NAMES[version] ?? String(version)
}

const ISO_MODELS = new Set<Enums.Model>([
  Enums.Model.MiniProISO,
  Enums.Model.MiniExtremeISO,
  Enums.Model.MiniExtremeISOG2,
  Enums.Model.SDIProISO,
  Enums.Model.SDIExtremeISO,
  Enums.Model.TelevisionStudioHD8ISO
])

export function isIsoCapableModel(model: Enums.Model): boolean {
  return ISO_MODELS.has(model)
}
