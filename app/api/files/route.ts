import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { file as fileSchema } from '@/lib/db/schema';

// Database setup
const client = postgres(process.env.DB_CONNECTION_STRING!);
const db = drizzle(client);

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const uploadedFile = formData.get('file') as File;
    const messageId = formData.get('messageId') as string | null;

    if (!uploadedFile) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (20MB limit for documents, images)
    const maxFileSize = 20 * 1024 * 1024; // 20MB
    if (uploadedFile.size > maxFileSize) {
      return NextResponse.json(
        { error: 'File size exceeds 20MB limit' },
        { status: 400 }
      );
    }

    // Validate file type (documents, images, text files)
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/json',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ];

    if (!allowedTypes.includes(uploadedFile.type)) {
      return NextResponse.json(
        { error: 'File type not supported' },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const { url } = await put(
      `chat-files/${session.user.id}/${Date.now()}-${uploadedFile.name}`,
      uploadedFile,
      {
        access: 'public',
      }
    );

    // Save file metadata to database
    const [savedFile] = await db
      .insert(fileSchema)
      .values({
        messageId: messageId || null,
        userId: session.user.id,
        name: uploadedFile.name,
        url,
        size: uploadedFile.size,
        type: uploadedFile.type,
      })
      .returning();

    return NextResponse.json({
      id: savedFile.id,
      name: savedFile.name,
      url: savedFile.url,
      size: savedFile.size,
      type: savedFile.type,
      createdAt: savedFile.createdAt,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 });
    }

    // Get files for the message
    const files = await db
      .select()
      .from(fileSchema)
      .where(eq(fileSchema.messageId, messageId));

    return NextResponse.json(files);
  } catch (error) {
    console.error('Files fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}