import 'server-only';

import type { UIMessage } from '@ai-sdk/react';
import { and, desc, eq, gte, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { chat, type DBMessage, message, vote } from './schema';

if (!process.env.DB_CONNECTION_STRING) {
  throw new Error('DB_CONNECTION_STRING environment variable is not set');
}

const client = postgres(process.env.DB_CONNECTION_STRING);
const db = drizzle(client);

// ============================================================================
// CHAT OPERATIONS
// ============================================================================

export async function createChat(
  userId: string,
  title: string,
  chatId?: string,
) {
  const values: any = {
    userId,
    title,
    visibility: 'private',
  };

  // If custom chatId provided (from server-side generation), use it
  if (chatId) {
    values.id = chatId;
  }

  const [newChat] = await db.insert(chat).values(values).returning();

  return newChat;
}

export async function getChatById(chatId: string) {
  const [chatData] = await db
    .select()
    .from(chat)
    .where(eq(chat.id, chatId))
    .limit(1);

  return chatData;
}

export async function getChatsByUserId(userId: string) {
  const chats = await db
    .select()
    .from(chat)
    .where(eq(chat.userId, userId))
    .orderBy(desc(chat.pinned), desc(chat.updatedAt));

  return chats;
}

export async function updateChatTitle(chatId: string, title: string) {
  const [updated] = await db
    .update(chat)
    .set({
      title,
      updatedAt: new Date(),
    })
    .where(eq(chat.id, chatId))
    .returning();

  return updated;
}

export async function deleteChat(chatId: string) {
  // Messages will be cascade deleted due to onDelete: 'cascade'
  await db.delete(chat).where(eq(chat.id, chatId));
}

export async function togglePinChat(chatId: string, pinned: boolean) {
  const [updated] = await db
    .update(chat)
    .set({
      pinned,
      updatedAt: new Date(),
    })
    .where(eq(chat.id, chatId))
    .returning();

  return updated;
}

// ============================================================================
// MESSAGE OPERATIONS
// ============================================================================

export async function saveMessage(
  chatId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  parts: any[],
  attachments: any[] = [],
  customId?: string, // Optional: use custom ID instead of auto-generated
) {
  const messageData: any = {
    chatId,
    role,
    content,
    parts,
    attachments,
  };

  // If custom ID provided, use it (for AI SDK message IDs)
  if (customId) {
    messageData.id = customId;
  }

  const [newMessage] = await db.insert(message).values(messageData).returning();

  // Update chat's updatedAt timestamp
  await db
    .update(chat)
    .set({ updatedAt: new Date() })
    .where(eq(chat.id, chatId));

  return newMessage;
}

export async function getMessagesByChatId(chatId: string) {
  const messages = await db
    .select()
    .from(message)
    .where(eq(message.chatId, chatId))
    .orderBy(message.createdAt);

  return messages;
}

/**
 * Get a single message by ID
 */
export async function getMessage(messageId: string) {
  const [msg] = await db
    .select()
    .from(message)
    .where(eq(message.id, messageId))
    .limit(1);

  return msg;
}

/**
 * Check if a message with the same content already exists in the chat
 * Used to prevent duplicate saves during regeneration
 */
export async function messageExists(
  chatId: string,
  role: 'user' | 'assistant',
  content: string,
) {
  const [existing] = await db
    .select()
    .from(message)
    .where(
      and(
        eq(message.chatId, chatId),
        eq(message.role, role),
        eq(message.content, content),
      ),
    )
    .limit(1);

  return !!existing;
}

/**
 * Check if a message with the given ID exists in the database
 * Used to prevent duplicate saves - if message has DB ID, it's already saved
 */
export async function messageExistsById(messageId: string) {
  const [existing] = await db
    .select()
    .from(message)
    .where(eq(message.id, messageId))
    .limit(1);

  return !!existing;
}

export async function updateMessage(
  messageId: string,
  content: string,
  parts: any[],
) {
  const [updated] = await db
    .update(message)
    .set({
      content,
      parts,
      isEdited: true,
      updatedAt: new Date(),
    })
    .where(eq(message.id, messageId))
    .returning();

  return updated;
}

export async function deleteMessage(messageId: string) {
  await db.delete(message).where(eq(message.id, messageId));
}

/**
 * Deletes a message and all messages after it (by timestamp)
 * Foreign-key aware: Deletes related votes before deleting messages
 * @param chatId - The chat ID containing the messages
 * @param messageId - The message ID to delete from (inclusive)
 */
export async function deleteMessagesAfter(chatId: string, messageId: string) {
  // Get the message to find its timestamp
  const [targetMessage] = await db
    .select()
    .from(message)
    .where(eq(message.id, messageId))
    .limit(1);

  if (!targetMessage) return;

  // Get all message IDs that will be deleted
  const messagesToDelete = await db
    .select({ id: message.id })
    .from(message)
    .where(
      and(
        eq(message.chatId, chatId),
        gte(message.createdAt, targetMessage.createdAt),
      ),
    );

  const messageIds = messagesToDelete.map((m) => m.id);

  if (messageIds.length === 0) return;

  // Delete related votes first (foreign key constraint)
  // This prevents foreign key violations when we delete messages
  if (messageIds.length > 0) {
    await db
      .delete(vote)
      .where(and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)));
  }

  // Now delete the messages
  await db
    .delete(message)
    .where(
      and(
        eq(message.chatId, chatId),
        gte(message.createdAt, targetMessage.createdAt),
      ),
    );
}

// ============================================================================
// CONVERSION UTILITIES
// ============================================================================

export function dbMessageToUIMessage(dbMessage: DBMessage): UIMessage {
  return {
    id: dbMessage.id,
    role: dbMessage.role as 'user' | 'assistant' | 'system',
    parts: dbMessage.parts || [
      {
        type: 'text',
        text: dbMessage.content,
      },
    ],
  };
}

export function dbMessagesToUIMessages(dbMessages: DBMessage[]): UIMessage[] {
  return dbMessages.map(dbMessageToUIMessage);
}

// ============================================================================
// CHAT TITLE GENERATION
// ============================================================================

export function generateChatTitle(firstUserMessage: string): string {
  // Take first 50 characters or first sentence
  const title = firstUserMessage.slice(0, 50);
  return title.length < firstUserMessage.length ? `${title}...` : title;
}
