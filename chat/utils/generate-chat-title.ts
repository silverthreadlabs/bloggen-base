import 'server-only';

import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

/**
 * Generate a concise title for a chat from the user's first message using AI
 * @param userMessage - The first user message
 * @returns A short, descriptive title (max 50 chars)
 */
export async function generateChatTitle(
  userMessage: string,
): Promise<string> {
  try {
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: `Generate a concise, descriptive title (max 6 words) for a chat that starts with this user message. Return ONLY the title, no quotes or extra text:\n\n"${userMessage}"`,
      temperature: 0.7,
      maxRetries: 1,
    });

    // Clean up the response - remove quotes, trim, and limit length
    const cleanTitle = text
      .replace(/^["']|["']$/g, '') // Remove leading/trailing quotes
      .trim()
      .slice(0, 50); // Max 50 characters

    return cleanTitle || 'New Chat';
  } catch (error) {
    console.error('Error generating chat title:', error);
    // Fallback to truncated user message
    return userMessage.slice(0, 50).trim() || 'New Chat';
  }
}
