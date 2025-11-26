// app/api/chats/[id]/share/route.ts

import { NextResponse } from 'next/server';
import {
  getAuthenticatedUserFromRequest,
  handleApiError,
  parseRouteParams,
} from '@/lib/api/utils';
import { getChatById, makeChatPublic } from '@/lib/db/chat-queries';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, context: RouteContext) {
  try {
    const user = await getAuthenticatedUserFromRequest(req);
    const { id } = await parseRouteParams(context.params);

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get chat WITHOUT relying on verifyChatOwnership
    const chat = await getChatById(id, user.id); // This one allows public + ownership

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found or you do not have access' },
        { status: 404 }
      );
    }

    // Only owner can make public
    if (chat.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Now safe to make public
    const updatedChat = await makeChatPublic(id, user.id);

    return NextResponse.json({ success: true, chat: updatedChat });
  } catch (error) {
    return handleApiError(error, 'Failed to make chat public');
  }
}