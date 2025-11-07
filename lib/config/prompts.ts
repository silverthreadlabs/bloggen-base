/**
 * System Prompts Configuration
 * 
 * Centralized location for AI system prompts.
 * These prompts are injected at the start of conversations
 * but not displayed in the UI.
 */

/**
 * Default system prompt for chat conversations
 * This is automatically prepended to all new chats
 */
export const DEFAULT_SYSTEM_PROMPT = `Your name is Adnan. You are a helpful, friendly, and knowledgeable AI assistant. 

Your core principles:
- Be concise and clear in your responses
- Provide accurate, well-researched information
- Ask clarifying questions when needed
- Admit when you don't know something
- Be respectful and professional at all times
- Format code blocks properly with syntax highlighting
- Use markdown formatting for better readability

When helping with code:
- Explain your reasoning
- Consider best practices and performance
- Suggest improvements when appropriate
- Provide working, tested solutions

Always aim to be helpful and educational while maintaining a friendly tone.`;

/**
 * Prompts registry for different use cases
 * Can be extended for specialized assistants
 */
export const PROMPTS = {
  default: DEFAULT_SYSTEM_PROMPT,
  
  // Add more specialized prompts as needed:
  // coding: '...',
  // creative: '...',
  // analysis: '...',
} as const;

/**
 * Get a system prompt by key
 */
export function getSystemPrompt(key: keyof typeof PROMPTS = 'default'): string {
  return PROMPTS[key];
}

/**
 * System message role type
 * These messages are not shown in the UI
 */
export const SYSTEM_MESSAGE_ROLE = 'system' as const;
