import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { file as fileSchema } from './schema';

// Database setup
const client = postgres(process.env.DB_CONNECTION_STRING!);
const db = drizzle(client);

/**
 * Gets files associated with a specific message
 */
export async function getFilesByMessageId(messageId: string) {
  try {
    return await db
      .select()
      .from(fileSchema)
      .where(eq(fileSchema.messageId, messageId));
  } catch (error) {
    console.error('Error getting files for message:', error);
    return [];
  }
}

/**
 * Gets a single file by ID
 */
export async function getFileById(fileId: string) {
  try {
    const result = await db
      .select()
      .from(fileSchema)
      .where(eq(fileSchema.id, fileId));
    return result[0];
  } catch (error) {
    console.error('Error getting file by ID:', error);
    return null;
  }
}

/**
 * Links uploaded files to a message
 */
export async function linkFilesToMessage(fileIds: string[], messageId: string) {
  try {
    if (fileIds.length === 0) return;
    
    await db
      .update(fileSchema)
      .set({ messageId })
      .where(eq(fileSchema.id, fileIds[0])); // Update one at a time to avoid SQL issues
    
    // Update remaining files if any
    for (let i = 1; i < fileIds.length; i++) {
      await db
        .update(fileSchema)
        .set({ messageId })
        .where(eq(fileSchema.id, fileIds[i]));
    }
  } catch (error) {
    console.error('Error linking files to message:', error);
    throw error;
  }
}

/**
 * Deletes a file record
 */
export async function deleteFile(fileId: string) {
  try {
    await db.delete(fileSchema).where(eq(fileSchema.id, fileId));
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}
