export type ToneOption =
  | 'neutral'
  | 'professional'
  | 'casual'
  | 'friendly'
  | 'concise';
export type LengthOption =
  | 'auto'
  | 'brief'
  | 'balanced'
  | 'detailed'
  | 'comprehensive';

// Markers to identify modifier sections in context
// Using UUID-like markers that wrap on their own lines for clean appearance
export const TONE_MARKER_START = '[tone-instruction]';
export const TONE_MARKER_END = '[/tone-instruction]';
export const LENGTH_MARKER_START = '[length-instruction]';
export const LENGTH_MARKER_END = '[/length-instruction]';

export const TONE_MODIFIERS: Record<ToneOption, string> = {
  neutral: '',
  professional:
    'Tone: Respond in a professional, formal tone suitable for business communication.',
  casual:
    'Tone: Respond in a casual, relaxed tone as if chatting with a friend.',
  friendly: 'Tone: Respond in a warm, friendly, and encouraging tone.',
  concise:
    'Tone: Respond in a direct, concise manner. Be brief and to the point.',
};

export const LENGTH_MODIFIERS: Record<LengthOption, string> = {
  auto: '',
  brief: 'Length: Keep your response very brief - 2-3 sentences maximum.',
  balanced: 'Length: Provide a balanced response - concise but complete.',
  detailed: 'Length: Provide a detailed response with explanations and examples.',
  comprehensive:
    'Length: Provide a comprehensive, in-depth response covering all aspects.',
};

// Get modifier with markers for identification
// Markers are minimized and placed naturally with the content
export function getToneModifierWithMarkers(tone: ToneOption): string {
  const modifier = TONE_MODIFIERS[tone];
  if (!modifier) return '';
  // Format: marker on own line, content on own line for clean display
  return `\n\n${TONE_MARKER_START}\n${modifier}\n${TONE_MARKER_END}`;
}

export function getLengthModifierWithMarkers(length: LengthOption): string {
  const modifier = LENGTH_MODIFIERS[length];
  if (!modifier) return '';
  // Format: marker on own line, content on own line for clean display
  return `\n${LENGTH_MARKER_START}\n${modifier}\n${LENGTH_MARKER_END}`;
}

// Format context for display (hide the HTML comment markers)
export function formatContextForDisplay(context: string): string {
  return context
    .replace(new RegExp(TONE_MARKER_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '')
    .replace(new RegExp(TONE_MARKER_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '')
    .replace(new RegExp(LENGTH_MARKER_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '')
    .replace(new RegExp(LENGTH_MARKER_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
}

export const TONE_LABELS: Record<ToneOption, string> = {
  neutral: 'Natural tone',
  professional: 'Professional',
  casual: 'Casual',
  friendly: 'Friendly',
  concise: 'Concise',
};

export const LENGTH_LABELS: Record<LengthOption, string> = {
  auto: 'Adaptive length',
  brief: 'Brief',
  balanced: 'Balanced',
  detailed: 'Detailed',
  comprehensive: 'Comprehensive',
};

export function applyMessageModifiers(
  content: string,
  tone: ToneOption = 'neutral',
  length: LengthOption = 'auto',
): string {
  let modifiedContent = content;

  if (tone !== 'neutral') {
    modifiedContent += TONE_MODIFIERS[tone];
  }

  if (length !== 'auto') {
    modifiedContent += LENGTH_MODIFIERS[length];
  }

  return modifiedContent;
}

export const DEFAULT_TONE: ToneOption = 'neutral';
export const DEFAULT_LENGTH: LengthOption = 'auto';
