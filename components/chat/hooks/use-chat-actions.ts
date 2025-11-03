import { useState } from 'react';

export function useChatActions() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (messageId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return {
    copiedId,
    handleCopy,
  };
}
