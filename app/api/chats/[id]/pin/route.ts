import { NextResponse } from 'next/server';
import { togglePinChat } from '@/lib/db/chat-queries';
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

// PATCH /api/chats/[id]/pin - Toggle pin status
export async function PATCH(req: Request, context: RouteContext) {
  try {
    const user = await getAuthenticatedUserFromRequest(req);
    const { id } = await parseRouteParams(context.params);
    const { pinned } = await req.json();

    // Validate pinned is a boolean (can be false, so we check typeof)
    if (typeof pinned !== 'boolean') {
      throw new Error('pinned must be a boolean');
    }
    
    await verifyChatOwnership(id, user.id);

    const updated = await togglePinChat(id, pinned);

    return NextResponse.json({ chat: updated });
  } catch (error) {
    return handleApiError(error, 'Error toggling pin');
  }
}

