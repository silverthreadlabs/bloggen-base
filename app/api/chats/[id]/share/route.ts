import { NextResponse } from 'next/server';
import {
  getAuthenticatedUserFromRequest,
  handleApiError,
  parseRouteParams,
  verifyChatOwnership,
} from '@/lib/api/utils';
import { makeChatPublic } from '@/lib/db/chat-queries';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, context: RouteContext) {
  try {
    const user = await getAuthenticatedUserFromRequest(req);
    const { id } = await parseRouteParams(context.params);

    await verifyChatOwnership(id, user.id);

    const updatedChat = await makeChatPublic(id, user.id);

    return NextResponse.json({ success: true, chat: updatedChat });
  } catch (error) {
    return handleApiError(error, 'Failed to make chat public');
  }
}