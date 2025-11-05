import { NextResponse } from 'next/server';
import {
  updateChatTitle,
  deleteChat,
  getMessagesByChatId,
  dbMessagesToUIMessages,
} from '@/lib/db/chat-queries';
import {
  getAuthenticatedUserFromRequest,
  verifyChatOwnership,
  validateRequired,
  handleApiError,
  parseRouteParams,
} from '@/lib/api/utils';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/chats/[id] - Get chat with messages
export async function GET(req: Request, context: RouteContext) {
  try {
    const user = await getAuthenticatedUserFromRequest(req);
    const { id } = await parseRouteParams(context.params);
    
    const chat = await verifyChatOwnership(id, user.id);
    const dbMessages = await getMessagesByChatId(id);
    
    // Convert DB messages to UIMessage format
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
