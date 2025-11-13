import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text
} from 'drizzle-orm/sqlite-core';

export const verificationStatuses = ['pending', 'approved', 'rejected'] as const;
export type VerificationStatus = (typeof verificationStatuses)[number];

export const reportStatuses = ['open', 'reviewing', 'resolved', 'rejected'] as const;
export type ReportStatus = (typeof reportStatuses)[number];

export const userRoles = ['user', 'admin'] as const;
export type UserRole = (typeof userRoles)[number];

export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    handle: text('handle').notNull(),
    displayName: text('display_name').notNull(),
    email: text('email'),
    avatarUrl: text('avatar_url'),
    bio: text('bio'),
    passwordHash: text('password_hash'),
    role: text('role').notNull().default('user'),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => ({
    handleIdx: index('users_handle_idx').on(table.handle),
    emailIdx: index('users_email_idx').on(table.email)
  })
);

export const userProfiles = sqliteTable(
  'user_profiles',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    verificationStatus: text('verification_status', {
      enum: verificationStatuses
    })
      .notNull()
      .default('pending'),
    pSize: text('p_size'),
    fSize: text('f_size'),
    age: integer('age'),
    wechatQrUrl: text('wechat_qr_url'),
    groupQrUrl: text('group_qr_url'),
    extra: text('extra', { mode: 'json' }).$type<Record<string, unknown> | null>(),
    qrAccess: integer('qr_access', { mode: 'boolean' }).notNull().default(false),
    verifiedBy: integer('verified_by'),
    verifiedAt: text('verified_at'),
    notes: text('notes'),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId] }),
    statusIdx: index('user_profiles_status_idx').on(table.verificationStatus)
  })
);

export const linkTypes = sqliteTable(
  'link_types',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    slug: text('slug').notNull(),
    label: text('label').notNull(),
    description: text('description')
  },
  (table) => ({
    slugIdx: index('link_types_slug_idx').on(table.slug)
  })
);

export const links = sqliteTable(
  'links',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    typeId: integer('type_id').references(() => linkTypes.id),
    title: text('title').notNull(),
    url: text('url').notNull(),
    order: integer('order').notNull().default(0),
    isHidden: integer('is_hidden', { mode: 'boolean' }).notNull().default(false),
    clicks: integer('clicks').notNull().default(0),
    metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown> | null>(),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => ({
    userIdx: index('links_user_idx').on(table.userId),
    typeIdx: index('links_type_idx').on(table.typeId)
  })
);

export const buttons = sqliteTable(
  'buttons',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    url: text('url').notNull(),
    icon: text('icon'),
    order: integer('order').notNull().default(0),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => ({
    userIdx: index('buttons_user_idx').on(table.userId)
  })
);

export const pages = sqliteTable(
  'pages',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    theme: text('theme').notNull().default('default'),
    blocks: text('blocks', { mode: 'json' }).$type<Record<string, unknown>[] | null>(),
    publishedAt: text('published_at'),
    updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => ({
    slugIdx: index('pages_slug_idx').on(table.slug),
    userIdx: index('pages_user_idx').on(table.userId)
  })
);

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value', { mode: 'json' }).$type<Record<string, unknown> | string>(),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const visits = sqliteTable(
  'visits',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    linkId: integer('link_id')
      .notNull()
      .references(() => links.id, { onDelete: 'cascade' }),
    userAgent: text('user_agent'),
    country: text('country'),
    referrer: text('referrer'),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => ({
    linkIdx: index('visits_link_idx').on(table.linkId)
  })
);

export const reports = sqliteTable(
  'reports',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    linkId: integer('link_id')
      .references(() => links.id, { onDelete: 'set null' }),
    reporterEmail: text('reporter_email'),
    reason: text('reason').notNull(),
    status: text('status', { enum: reportStatuses }).notNull().default('open'),
    metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown> | null>(),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => ({
    statusIdx: index('reports_status_idx').on(table.status)
  })
);

export const socialAccounts = sqliteTable(
  'social_accounts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    handle: text('handle').notNull(),
    url: text('url').notNull(),
    verified: integer('verified', { mode: 'boolean' }).notNull().default(false),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => ({
    providerIdx: index('social_accounts_provider_idx').on(table.provider, table.userId)
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type Link = typeof links.$inferSelect;
export type Report = typeof reports.$inferSelect;
