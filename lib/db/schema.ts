import type { InferSelectModel } from 'drizzle-orm';
import {
  boolean,
  foreignKey,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import type { AppUsage } from '../usage';

// Better Auth uses string IDs, not UUIDs
export const user = pgTable('user', {
  id: text('id').primaryKey().notNull(), // Better Auth uses string IDs
  name: text('name').notNull(),
  email: varchar('email', { length: 64 }).notNull().unique(),
  emailVerified: boolean('emailVerified').notNull(),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
  twoFactorEnabled: boolean('twoFactorEnabled'),
  role: text('role'),
  banned: boolean('banned'),
  banReason: text('banReason'),
  banExpires: timestamp('banExpires'),
  stripeCustomerId: text('stripeCustomerId'),
  password: varchar('password', { length: 64 }),
  isAnonymous: boolean('isAnonymous').notNull().default(false),
});

export type User = InferSelectModel<typeof user>;

export const session = pgTable('session', {
  id: text('id').primaryKey().notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id), // Better Auth uses string IDs
  activeOrganizationId: text('activeOrganizationId'),
  impersonatedBy: text('impersonatedBy'),
});

export type Session = InferSelectModel<typeof session>;

export const account = pgTable('account', {
  id: text('id').primaryKey().notNull(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id), // Better Auth uses string IDs
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
});

export type Account = InferSelectModel<typeof account>;

export const verification = pgTable('verification', {
  id: text('id').primaryKey().notNull(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt'),
  updatedAt: timestamp('updatedAt'),
});

export type Verification = InferSelectModel<typeof verification>;

export const organization = pgTable('organization', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logo: text('logo'),
  createdAt: timestamp('createdAt').notNull(),
  metadata: text('metadata'),
});

export type Organization = InferSelectModel<typeof organization>;

export const member = pgTable('member', {
  id: text('id').primaryKey().notNull(),
  organizationId: text('organizationId')
    .notNull()
    .references(() => organization.id),
  userId: text('userId')
    .notNull()
    .references(() => user.id), // Better Auth uses string IDs
  role: text('role').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type Member = InferSelectModel<typeof member>;

export const invitation = pgTable('invitation', {
  id: text('id').primaryKey().notNull(),
  organizationId: text('organizationId')
    .notNull()
    .references(() => organization.id),
  email: text('email').notNull(),
  role: text('role'),
  status: text('status').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  inviterId: text('inviterId')
    .notNull()
    .references(() => user.id), // Better Auth uses string IDs
});

export type Invitation = InferSelectModel<typeof invitation>;

export const twoFactor = pgTable('twoFactor', {
  id: text('id').primaryKey().notNull(),
  secret: text('secret').notNull(),
  backupCodes: text('backupCodes').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id), // Better Auth uses string IDs
});

export type TwoFactor = InferSelectModel<typeof twoFactor>;

export const passkey = pgTable('passkey', {
  id: text('id').primaryKey().notNull(),
  name: text('name'),
  publicKey: text('publicKey').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id), // Better Auth uses string IDs
  credentialID: text('credentialID').notNull(),
  counter: integer('counter').notNull(),
  deviceType: text('deviceType').notNull(),
  backedUp: boolean('backedUp').notNull(),
  transports: text('transports'),
  createdAt: timestamp('createdAt'),
});

export type Passkey = InferSelectModel<typeof passkey>;

export const subscription = pgTable('subscription', {
  id: text('id').primaryKey().notNull(),
  plan: text('plan').notNull(),
  referenceId: text('referenceId').notNull(),
  stripeCustomerId: text('stripeCustomerId'),
  stripeSubscriptionId: text('stripeSubscriptionId'),
  status: text('status').notNull(),
  periodStart: timestamp('periodStart'),
  periodEnd: timestamp('periodEnd'),
  cancelAtPeriodEnd: boolean('cancelAtPeriodEnd'),
  seats: integer('seats'),
  trialStart: timestamp('trialStart'),
  trialEnd: timestamp('trialEnd'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type Subscription = InferSelectModel<typeof subscription>;

export const chat = pgTable('chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  title: text('title').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id),
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
  lastContext: jsonb('lastContext').$type<AppUsage | null>(),
  pinned: boolean('pinned').notNull().default(false),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable('message', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id, { onDelete: 'cascade' }),
  role: varchar('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
  context: text('context'), // Renamed from content, now optional - use parts instead
  parts: jsonb('parts').notNull().$type<any[]>(),
  attachments: jsonb('attachments').$type<any[]>(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt'),
  isEdited: boolean('isEdited').notNull().default(false),
});

export type DBMessage = InferSelectModel<typeof message>;

export const vote = pgTable('vote', {
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  messageId: uuid('messageId')
    .notNull()
    .references(() => message.id),
  isUpvoted: boolean('isUpvoted').notNull(),
});

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  'document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('text', { enum: ['text', 'code', 'image', 'sheet'] })
      .notNull()
      .default('text'),
    userId: text('userId')
      .notNull()
      .references(() => user.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id, table.createdAt] }),
  }),
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: text('userId')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  'stream',
  {
    id: uuid('id').notNull().defaultRandom(),
    chatId: uuid('chatId').notNull(),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  }),
);

export type Stream = InferSelectModel<typeof stream>;

export const file = pgTable('file', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  messageId: uuid('messageId').references(() => message.id, { onDelete: 'cascade' }),
  userId: text('userId')
    .notNull()
    .references(() => user.id),
  name: text('name').notNull(),
  url: text('url').notNull(),
  type: text('type').notNull(), // MIME type
  size: integer('size').notNull(), // Size in bytes
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type File = InferSelectModel<typeof file>;
