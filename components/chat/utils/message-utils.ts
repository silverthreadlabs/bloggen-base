import type { UIMessage } from 'ai';

export function extractMessageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => (part.type === 'text' ? part.text : ''))
    .join('');
}

export function isLastAssistantMessage(
  message: UIMessage,
  index: number,
  messages: UIMessage[],
  isLoading: boolean
): boolean {
  return (
    message.role === 'assistant' &&
    index === messages.length - 1 &&
    !isLoading
  );
}
