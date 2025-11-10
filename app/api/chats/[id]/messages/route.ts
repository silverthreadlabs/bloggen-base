import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import {
  getChatById,
  getMessagesByChatId,
  saveMessage,
} from '@/lib/db/chat-queries';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/chats/[id]/messages - Get all messages for a chat
export async function GET(req: Request, context: RouteContext) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const chat = await getChatById(id);

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (chat.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const messages = await getMessagesByChatId(id);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 },
    );
  }
}

// POST /api/chats/[id]/messages - Save a new message
export async function POST(req: Request, context: RouteContext) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: chatId } = await context.params;

    // Handle aborted requests gracefully
    let body: {
      role: string;
      content: string;
      parts: any[];
      attachments?: any[];
    };
    try {
      body = await req.json();
    } catch (error) {
      // Request was aborted or body is empty
      if (
        error instanceof Error &&
        (error.message.includes('aborted') || error.message.includes('JSON'))
      ) {
        return NextResponse.json(
          { error: 'Request aborted or invalid' },
          { status: 400 },
        );
      }
      throw error;
    }

    const { role, content, parts, attachments = [] } = body;
    const customId = (body as any).id; // Extract id if it exists, but don't error

    if (!role || !content) {
      return NextResponse.json(
        { error: 'Role and content are required' },
        { status: 400 },
      );
    }

    if (role !== 'user' && role !== 'assistant' && role !== 'system') {
      return NextResponse.json(
        { error: 'Invalid role. Must be user, assistant, or system' },
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

    const message = await saveMessage(
      chatId,
      role,
      content,
      parts || [{ type: 'text', text: content }],
      attachments,
      customId, // Pass custom ID if provided (for AI SDK message IDs)
    );

    return NextResponse.json({ message });
  } catch (error) {
    // Don't log aborted requests as errors
    if (error instanceof Error && error.message.includes('aborted')) {
      return NextResponse.json({ error: 'Request aborted' }, { status: 400 });
    }

    console.error('Error saving message:', error);
    return NextResponse.json(
      { error: 'Failed to save message' },
      { status: 500 },
    );
  }
}
