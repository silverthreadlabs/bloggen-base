import { useState } from 'react';

import { DEFAULT_LENGTH, DEFAULT_TONE, LengthOption, ToneOption } from '@/chat/utils/message-modifiers';

/**
 * Combined chat message modifiers (tone and length)
 * Now uses local state instead of URL params
 */
export function useMessageModifiers() {
    const [modifiers, setModifiers] = useState<{
        tone: ToneOption;
        length: LengthOption;
    }>({
        tone: DEFAULT_TONE,
        length: DEFAULT_LENGTH
    });

    return [modifiers, setModifiers] as const;
}
