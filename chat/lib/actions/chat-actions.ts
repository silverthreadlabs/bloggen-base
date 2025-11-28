'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import {
  deleteMessagesAfter,
  getChatById,
  getMessage,
  togglePinChat as togglePinChatQuery,
} from '@/lib/db/chat-queries';
import { ChatSDKError } from '@/chat/utils/errors';

/**
 * Server action to delete a message and all messages after it
 * Used for regenerate and edit message functionality
 * @param id - The message ID to delete from (inclusive)
 * @returns Object with success status and chatId
 */
export async function deleteTrailingMessages({ id }: { id: string }) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user?.id) {
      throw new ChatSDKError('unauthorized:chat');
    }

    // Get the message to find its chat and timestamp
    const message = await getMessage(id);
    
    if (!message) {
      throw new ChatSDKError('not_found:chat', 'Message not found');
    }

    // Verify the user owns this chat
    const chat = await getChatById(message.chatId);
    if (!chat) {
      throw new ChatSDKError('not_found:chat', 'Chat not found');
    }
    if (chat.userId !== session.user.id) {
      throw new ChatSDKError('forbidden:chat');
    }

    // Delete the message and all messages after it
    await deleteMessagesAfter(chat.id, message.id);
    
    return { success: true, chatId: chat.id };
  } catch (error) {
    if (error instanceof ChatSDKError) {
      throw error;
    }
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete trailing messages',
    );
  }
}

/**
 * Server action to verify user has access to a chat
 * Reusable authorization check
 */
export async function verifyChatAccess(chatId: string, userId: string) {
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
 * Server action to get authenticated user session
 * Reusable authentication check
 */
export async function getAuthenticatedUser() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session?.user?.id) {
    throw new ChatSDKError('unauthorized:chat');
  }

  return session.user;
}

/**
 * Server action to toggle pin status of a chat
 * Directly calls database query for atomic update (no API round trip)
 * @param chatId - The chat ID to toggle pin status
 * @param pinned - The new pin status (true/false)
 * @returns The updated chat object
 */
export async function togglePinChat(chatId: string, pinned: boolean) {
  try {
    const user = await getAuthenticatedUser();

    // Verify the user owns this chat
    await verifyChatAccess(chatId, user.id);

    // Atomic database update
    const updated = await togglePinChatQuery(chatId, pinned);

    return {
      ...updated,
      createdAt:
        updated.createdAt instanceof Date
          ? updated.createdAt
          : new Date(updated.createdAt),
      updatedAt:
        updated.updatedAt instanceof Date
          ? updated.updatedAt
          : new Date(updated.updatedAt),
    };
  } catch (error) {
    if (error instanceof ChatSDKError) {
      throw error;
    }
    console.error('Error in togglePinChat:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to toggle pin status',
    );
  }
}
