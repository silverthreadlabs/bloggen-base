import 'server-only';

import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { generateUUID } from '../utils';
import { type User, user } from './schema';
import { generateHashedPassword } from './utils';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
if (!process.env.DB_CONNECTION_STRING) {
  throw new Error('DB_CONNECTION_STRING environment variable is not set');
}

const client = postgres(process.env.DB_CONNECTION_STRING);
const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    throw new Error('Failed to get user by email');
  }
}

// chat/ai removed

export async function getUserById(id: string): Promise<User | null> {
  try {
    const [userRecord] = await db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    return userRecord || null;
  } catch (error) {
    console.error('Failed to get user by ID:', error);
    return null;
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await db.insert(user).values({
      id: generateUUID(),
      email,
      password: hashedPassword,
      name: email,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: 'user',
    });
  } catch (error) {
    throw new Error('Failed to create user');
  }
}
