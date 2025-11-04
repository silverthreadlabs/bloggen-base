import { NextResponse } from 'next/server';
import {
  createChat,
  getChatsByUserId,
} from '@/lib/db/chat-queries';
import {
  getAuthenticatedUserFromRequest,
  validateRequired,
  handleApiError,
} from '@/lib/api/utils';

// GET /api/chats - Get all chats for user
export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUserFromRequest(req);
    const chats = await getChatsByUserId(user.id);

    return NextResponse.json({ chats });
  } catch (error) {
    return handleApiError(error, 'Error fetching chats');
  }
}

// POST /api/chats - Create new chat
export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUserFromRequest(req);
    const { title } = await req.json();

    validateRequired({ title }, ['title']);

    const chat = await createChat(user.id, title);

    return NextResponse.json({ chat });
  } catch (error) {
    return handleApiError(error, 'Error creating chat');
  }
}
