import { put } from '@vercel/blob';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { file as fileSchema } from '@/lib/db/schema';
import { isMimeTypeAllowed } from '@/chat/utils/file-types';
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
    
    // messageId is not needed during upload - files are uploaded before message is created

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

    // Validate file type (comprehensive list of supported document, text, code, and image files)
    // const allowedTypes = [
    //   // PDF Documents
    //   'application/pdf',
      
    //   // Microsoft Office Documents
    //   'application/msword', // .doc
    //   'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    //   'application/vnd.ms-powerpoint', // .ppt
    //   'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    //   'application/vnd.ms-excel', // .xls
    //   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      
    //   // Text Files
    //   'text/plain', // .txt
    //   'application/rtf', // .rtf
    //   'text/markdown', // .md
      
    //   // OpenDocument Files
    //   'application/vnd.oasis.opendocument.text', // .odt
    //   'application/vnd.oasis.opendocument.spreadsheet', // .ods
    //   'application/vnd.oasis.opendocument.presentation', // .odp
      
    //   // Data Files
    //   'text/csv', // .csv
    //   'text/tab-separated-values', // .tsv
    //   'application/json', // .json
    //   'application/x-yaml', // .yaml
    //   'text/yaml', // .yaml, .yml
    //   'application/xml', // .xml
    //   'text/xml', // .xml
    //   'text/html', // .html, .htm
      
    //   // Programming Languages
    //   'text/javascript', // .js
    //   'application/javascript', // .js
    //   'text/typescript', // .ts
    //   'application/typescript', // .ts
    //   'text/jsx', // .jsx
    //   'text/tsx', // .tsx
    //   'text/x-python', // .py
    //   'text/python', // .py
    //   'text/x-java-source', // .java
    //   'text/x-c', // .c
    //   'text/x-c++src', // .cpp
    //   'text/x-chdr', // .h
    //   'text/x-c++hdr', // .hpp
    //   'text/x-csharp', // .cs
    //   'text/x-php', // .php
    //   'application/x-httpd-php', // .php
    //   'text/x-ruby', // .rb
    //   'text/x-go', // .go
    //   'text/x-rustsrc', // .rs
    //   'text/x-swift', // .swift
    //   'text/x-kotlin', // .kt
    //   'text/x-scala', // .scala
    //   'text/x-shellscript', // .sh, .bash
    //   'application/x-sh', // .sh
    //   'application/x-bash', // .bash
      
    //   // Images
    //   'image/png', // .png
    //   'image/jpeg', // .jpg, .jpeg
    //   'image/gif', // .gif
    //   'image/webp', // .webp
    //   'image/svg+xml', // .svg
    //   'image/heic', // .heic
    //   'image/heif', // .heif
    // ];

    if (!isMimeTypeAllowed(uploadedFile.type)) {
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

    // Save file metadata to database (without messageId - will be associated later)
    const [savedFile] = await db
      .insert(fileSchema)
      .values({
        messageId: null, // Files are uploaded before message is created
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
    // Ensure we always return JSON even on error
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to upload file',
        details: error instanceof Error ? error.stack : String(error)
      },
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