import { z } from 'zod';
import { reportStatuses, verificationStatuses } from './dto';

const metadataSchema = z.record(z.any());

export const verificationProfileSchema = z.object({
  verificationStatus: z.enum(verificationStatuses),
  pSize: z.string().max(32).optional(),
  fSize: z.string().max(32).optional(),
  age: z.number().int().nonnegative().optional(),
  height: z.number().int().nonnegative().optional(),
  weight: z.number().int().nonnegative().optional(),
  wechatQrUrl: z.string().url().optional(),
  groupQrUrl: z.string().url().optional(),
  extra: metadataSchema.optional(),
  verifiedBy: z.number().int().optional(),
  verifiedAt: z.string().optional(),
  notes: z.string().optional(),
  qrAccess: z.boolean().optional(),
  topPosition: z.string().max(32).optional(),
  bottomPosition: z.string().max(32).optional(),
  versPosition: z.string().max(32).optional(),
  sidePreference: z.string().max(32).optional(),
  hidePosition: z.boolean().optional(),
  features: metadataSchema.optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export const linkTypeSchema = z.object({
  id: z.number().int(),
  slug: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional()
});

export const linkSchema = z.object({
  id: z.number().int(),
  title: z.string().min(1),
  url: z.string().url(),
  order: z.number().int(),
  isHidden: z.boolean(),
  clicks: z.number().int(),
  type: linkTypeSchema.optional(),
  metadata: metadataSchema.optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export const buttonSchema = z.object({
  id: z.number().int(),
  label: z.string().min(1),
  url: z.string().url(),
  icon: z.string().optional(),
  order: z.number().int()
});

export const pageSchema = z.object({
  id: z.number().int(),
  slug: z.string().min(1),
  title: z.string().min(1),
  theme: z.string().min(1),
  blocks: z.array(metadataSchema).optional(),
  publishedAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export const socialAccountSchema = z.object({
  id: z.number().int(),
  provider: z.string().min(1),
  handle: z.string().min(1),
  url: z.string().url(),
  verified: z.boolean()
});

export const reportSchema = z.object({
  id: z.number().int(),
  linkId: z.number().int().nullable().optional(),
  reporterEmail: z.string().email().optional(),
  reason: z.string().min(1),
  status: z.enum(reportStatuses),
  metadata: metadataSchema.optional(),
  createdAt: z.string()
});

export const createReportSchema = z.object({
  linkId: z.number().int().positive().optional(),
  reporterEmail: z.string().email().optional(),
  reason: z.string().min(1),
  metadata: metadataSchema.optional()
});

export const settingsSchema = z.object({
  theme: z.string().min(1),
  accentColor: z.string().regex(/^#?[0-9A-Fa-f]{6}$/),
  allowPublicProfiles: z.boolean(),
  verificationRequired: z.boolean()
});

export const userSchema = z.object({
  id: z.number().int(),
  handle: z.string().min(1),
  displayName: z.string().min(1),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().optional(),
  role: z.string().optional(),
  profile: verificationProfileSchema.optional(),
  links: z.array(linkSchema).optional(),
  buttons: z.array(buttonSchema).optional(),
  pages: z.array(pageSchema).optional(),
  socialAccounts: z.array(socialAccountSchema).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export const paginatedResultSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    items: z.array(schema),
    total: z.number().int().nonnegative(),
    cursor: z.string().optional(),
    hasMore: z.boolean()
  });

export const apiResponseSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    data: schema,
    meta: z
      .object({
        pagination: z
          .object({
            total: z.number().int().nonnegative(),
            cursor: z.string().optional(),
            hasMore: z.boolean()
          })
          .optional(),
        requestId: z.string().optional()
      })
      .optional()
  });

export const verificationRequestSchema = z.object({
  pSize: z.string().max(32).optional(),
  fSize: z.string().max(32).optional(),
  age: z.number().int().nonnegative().optional(),
  height: z.number().int().nonnegative().optional(),
  weight: z.number().int().nonnegative().optional(),
  wechatQrUrl: z.string().url().optional(),
  groupQrUrl: z.string().url().optional(),
  extra: metadataSchema.optional(),
  notes: z.string().optional(),
  topPosition: z.string().max(32).optional(),
  bottomPosition: z.string().max(32).optional(),
  versPosition: z.string().max(32).optional(),
  sidePreference: z.string().max(32).optional(),
  hidePosition: z.boolean().optional(),
  features: metadataSchema.optional()
});

export const updateUserProfileSchema = verificationRequestSchema.extend({
  verificationStatus: z.enum(verificationStatuses).optional(),
  qrAccess: z.boolean().optional(),
  displayName: z
    .string()
    .min(1)
    .max(64)
    .optional(),
  password: z
    .string()
    .min(6)
    .max(64)
    .optional()
});

export const upsertLinkSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  order: z.number().int().nonnegative().optional(),
  isHidden: z.boolean().optional(),
  typeId: z.number().int().optional(),
  metadata: metadataSchema.optional()
});

export const publicProfileRequestSchema = z.object({
  handle: z.string().min(3).max(32),
  displayName: z.string().min(1).max(64),
  email: z.string().email(),
  password: z.string().min(6),
  bio: z.string().max(280).optional(),
  profile: verificationRequestSchema,
  links: z.array(upsertLinkSchema).max(10).optional(),
  turnstileToken: z.string().min(10).optional()
});

export const settingsUpdateSchema = z
  .object({
    theme: z.string().min(1).optional(),
    accentColor: z.string().regex(/^#?[0-9A-Fa-f]{6}$/).optional(),
    allowPublicProfiles: z.boolean().optional(),
    verificationRequired: z.boolean().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required'
  });

export const registerSchema = z.object({
  handle: z.string().min(3).max(32),
  displayName: z.string().min(1).max(64),
  email: z.string().email().optional(),
  password: z.string().min(6)
});

export const loginSchema = z.object({
  handle: z.string().min(3).max(32),
  password: z.string().min(1)
});

export const updateReportStatusSchema = z.object({
  status: z.enum(reportStatuses)
});
