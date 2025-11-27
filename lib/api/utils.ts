/**
 * Reusable API utilities for request handling
 * Promotes DRY principle and consistent error handling
 */

import { auth } from '@/lib/auth/auth';
import { getChatById } from '@/lib/db/chat-queries';
import { ChatSDKError } from '@/lib/errors';

/**
 * Get authenticated user from request
 * @throws ChatSDKError if not authenticated
 */
export async function getAuthenticatedUserFromRequest(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session?.user?.id) {
    throw new ChatSDKError('unauthorized:chat');
  }

  return session.user;
}

/**
 * Get optional user from request (returns null if not authenticated)
 */
export async function getOptionalUserFromRequest(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  return session?.user ?? null;
}

/**
 * Verify user owns the chat
 * @throws ChatSDKError if chat not found or forbidden
 */
export async function verifyChatOwnership(chatId: string, userId: string) {
  const chat = await getChatById(chatId);

  if (!chat) {
    throw new ChatSDKError('not_found:chat');
  }

  if (chat.userId !== userId) {
    throw new ChatSDKError('forbidden:chat');
  }

  return chat;
}

/**
 * Validate required fields in request body
 * @throws ChatSDKError if validation fails
 */
export function validateRequired<T extends Record<string, any>>(
  data: T,
  fields: Array<keyof T>,
  errorMessage?: string,
): void {
  for (const field of fields) {
    if (
      !data[field] ||
      (typeof data[field] === 'string' && !data[field].trim())
    ) {
      throw new ChatSDKError(
        'bad_request:chat',
        errorMessage || `${String(field)} is required`,
      );
    }
  }
}

/**
 * Handle API errors consistently
 * Returns proper Response object based on error type
 */
export function handleApiError(error: unknown, context?: string): Response {
  if (context) {
    console.error(`${context}:`, error);
  } else {
    console.error('API Error:', error);
  }

  if (error instanceof ChatSDKError) {
    return error.toResponse();
  }

  return new ChatSDKError(
    'bad_request:database',
    'An unexpected error occurred',
  ).toResponse();
}

/**
 * Parse route params safely (for Next.js 15 async params)
 */
export async function parseRouteParams<T>(params: Promise<T>): Promise<T> {
  return await params;
}
