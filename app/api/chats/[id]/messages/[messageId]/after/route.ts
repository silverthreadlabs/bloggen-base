import { deleteMessagesAfter } from '@/lib/db/chat-queries';
import {
  getAuthenticatedUserFromRequest,
  verifyChatOwnership,
  handleApiError,
} from '@/lib/api/utils';

/**
 * DELETE /api/chats/[id]/messages/[messageId]/after
 * Delete a message and all messages after it
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; messageId: string } }
) {
  try {
    const user = await getAuthenticatedUserFromRequest(req);
    const { id: chatId, messageId } = params;

    await verifyChatOwnership(chatId, user.id);
    await deleteMessagesAfter(chatId, messageId);

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, 'Error deleting messages');
  }
}
