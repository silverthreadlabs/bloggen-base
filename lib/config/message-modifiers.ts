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

export const TONE_MODIFIERS: Record<ToneOption, string> = {
  neutral: '',
  professional:
    '\n\n[Respond in a professional, formal tone suitable for business communication.]',
  casual:
    '\n\n[Respond in a casual, relaxed tone as if chatting with a friend.]',
  friendly: '\n\n[Respond in a warm, friendly, and encouraging tone.]',
  concise:
    '\n\n[Respond in a direct, concise manner. Be brief and to the point.]',
};

export const LENGTH_MODIFIERS: Record<LengthOption, string> = {
  auto: '',
  brief: '\n\n[Keep your response very brief - 2-3 sentences maximum.]',
  balanced: '\n\n[Provide a balanced response - concise but complete.]',
  detailed: '\n\n[Provide a detailed response with explanations and examples.]',
  comprehensive:
    '\n\n[Provide a comprehensive, in-depth response covering all aspects.]',
};

export const TONE_LABELS: Record<ToneOption, string> = {
  neutral: 'Neutral',
  professional: 'Professional',
  casual: 'Casual',
  friendly: 'Friendly',
  concise: 'Concise',
};

export const LENGTH_LABELS: Record<LengthOption, string> = {
  auto: 'Auto',
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
