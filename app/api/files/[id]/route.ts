import { del } from '@vercel/blob';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and } from 'drizzle-orm';
import { file as fileSchema } from '@/lib/db/schema';

// Database setup
const client = postgres(process.env.DB_CONNECTION_STRING!);
const db = drizzle(client);

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params (Next.js 15 requirement)
    const { id: fileId } = await params;

    // Get file from database
    const [file] = await db
      .select()
      .from(fileSchema)
      .where(
        and(
          eq(fileSchema.id, fileId),
          eq(fileSchema.userId, session.user.id)
        )
      );

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Delete from Vercel Blob
    try {
      await del(file.url);
    } catch (error) {
      console.error('Failed to delete file from blob storage:', error);
      // Continue even if blob deletion fails
    }

    // Delete from database
    await db
      .delete(fileSchema)
      .where(eq(fileSchema.id, fileId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('File deletion error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to delete file',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}
