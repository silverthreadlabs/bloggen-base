import { NextResponse } from 'next/server';
import {
  getAuthenticatedUserFromRequest,
  handleApiError,
  parseRouteParams,
  validateRequired,
  verifyChatOwnership,
} from '@/lib/api/utils';
import {
  dbMessagesToUIMessages,
  deleteChat,
  getMessagesByChatId,
  updateChatTitle,
  getChatById
} from '@/lib/db/chat-queries';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/chats/[id] - Get chat with messages
export async function GET(req: Request, context: RouteContext) {
  try {
    const { id } = await parseRouteParams(context.params);

    // Try to get session (may be null for public access)
    let userId: string | undefined;
    try {
      const user = await getAuthenticatedUserFromRequest(req);
      userId = user.id;
    } catch (error) {
      // Not authenticated → that's OK for public chats
      userId = undefined;
    }

    // This function allows public + owner access
    const chat = await getChatById(id, userId);

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found or access denied' },
        { status: 404 }
      );
    }

    const dbMessages = await getMessagesByChatId(id);
    const messages = dbMessagesToUIMessages(dbMessages);

    return NextResponse.json({ chat, messages });
  } catch (error) {
    return handleApiError(error, 'Error fetching chat');
  }
}

// PATCH /api/chats/[id] - Update chat title
export async function PATCH(req: Request, context: RouteContext) {
  try {
    const user = await getAuthenticatedUserFromRequest(req);
    const { id } = await parseRouteParams(context.params);
    const { title } = await req.json();

    validateRequired({ title }, ['title']);
    await verifyChatOwnership(id, user.id);

    const updated = await updateChatTitle(id, title);

    return NextResponse.json({ chat: updated });
  } catch (error) {
    return handleApiError(error, 'Error updating chat');
  }
}

// DELETE /api/chats/[id] - Delete chat
export async function DELETE(req: Request, context: RouteContext) {
  try {
    const user = await getAuthenticatedUserFromRequest(req);
    const { id } = await parseRouteParams(context.params);

    await verifyChatOwnership(id, user.id);
    await deleteChat(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'Error deleting chat');
  }
}
