import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { NextResponse } from 'next/server';
import postgres from 'postgres';
import { auth } from '@/lib/auth/auth';
import {
  deleteMessage,
  getChatById,
  updateMessage,
} from '@/lib/db/chat-queries';
import { message as messageTable } from '@/lib/db/schema';

if (!process.env.DB_CONNECTION_STRING) {
  throw new Error('DB_CONNECTION_STRING environment variable is not set');
}

const client = postgres(process.env.DB_CONNECTION_STRING);
const db = drizzle(client);

type RouteContext = {
  params: Promise<{ id: string; messageId: string }>;
};

// PATCH /api/chats/[id]/messages/[messageId] - Update message
export async function PATCH(req: Request, context: RouteContext) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: chatId, messageId } = await context.params;
    const { content, parts } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 },
      );
    }

    const chat = await getChatById(chatId);

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (chat.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await updateMessage(
      messageId,
      content,
      parts || [{ type: 'text', text: content }],
    );

    return NextResponse.json({ message: updated });
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 },
    );
  }
}

// DELETE /api/chats/[id]/messages/[messageId] - Delete message
export async function DELETE(req: Request, context: RouteContext) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: chatId, messageId } = await context.params;
    const chat = await getChatById(chatId);

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (chat.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify message belongs to this chat
    const [msg] = await db
      .select()
      .from(messageTable)
      .where(eq(messageTable.id, messageId))
      .limit(1);

    if (!msg || msg.chatId !== chatId) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    await deleteMessage(messageId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 },
    );
  }
}
