import { createDb, schema, type Database } from '@gmgncard/db';
import type { UpdateUserProfilePayload, UserDTO } from '@gmgncard/types';
import {
  asc,
  desc,
  eq,
  inArray,
  sql
} from 'drizzle-orm';
import { RESOURCE_IDS } from '@gmgncard/config';
import type { WorkerEnv } from '../types';

const { users, userProfiles, links, linkTypes } = schema;

type UserRow = typeof users.$inferSelect;
type ProfileRow = typeof userProfiles.$inferSelect | null;
type LinkRow = typeof links.$inferSelect;
type LinkTypeRow = typeof linkTypes.$inferSelect | null;

interface JoinedUserRow {
  user: UserRow;
  profile: ProfileRow;
}

interface JoinedLinkRow {
  link: LinkRow;
  type: LinkTypeRow;
}

export class UserRepository {
  constructor(private readonly db: Database) {}

  static fromEnv(env: WorkerEnv) {
    return new UserRepository(createDb(env[RESOURCE_IDS.d1]));
  }

  async listUsers(limit = 20) {
    const rows = await this.db
      .select({
        user: users,
        profile: userProfiles
      })
      .from(users)
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .orderBy(desc(users.createdAt))
      .limit(limit);

    const userIds = rows.map((row) => row.user.id!).filter(Boolean);
    const linksByUser = await this.loadLinksForUsers(userIds);

    return rows.map((row) =>
      this.toUserDto(row, linksByUser.get(row.user.id ?? -1))
    );
  }

  async listPending(limit = 20) {
    const rows = await this.db
      .select({ user: users, profile: userProfiles })
      .from(users)
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(eq(userProfiles.verificationStatus, 'pending'))
      .orderBy(desc(userProfiles.updatedAt))
      .limit(limit);

    const userIds = rows.map((row) => row.user.id!).filter(Boolean);
    const linksByUser = await this.loadLinksForUsers(userIds);

    return rows.map((row) =>
      this.toUserDto(row, linksByUser.get(row.user.id ?? -1))
    );
  }

  async listFeatured(limit = 12) {
    const rows = await this.db
      .select({ user: users, profile: userProfiles })
      .from(users)
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(eq(users.isFeatured, true))
      .orderBy(desc(users.updatedAt))
      .limit(limit);

    const userIds = rows.map((row) => row.user.id!).filter(Boolean);
    const linksByUser = await this.loadLinksForUsers(userIds);
    return rows.map((row) => this.toUserDto(row, linksByUser.get(row.user.id ?? -1)));
  }

  async listPublic(limit = 50) {
    const rows = await this.db
      .select({ user: users, profile: userProfiles })
      .from(users)
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(eq(userProfiles.verificationStatus, 'approved'))
      .orderBy(desc(users.isFeatured), desc(users.updatedAt))
      .limit(limit);

    const userIds = rows.map((row) => row.user.id!).filter(Boolean);
    const linksByUser = await this.loadLinksForUsers(userIds);
    return rows.map((row) => this.toUserDto(row, linksByUser.get(row.user.id ?? -1)));
  }

  async findByHandle(handle: string) {
    const rows = await this.db
      .select({
        user: users,
        profile: userProfiles
      })
      .from(users)
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(eq(users.handle, handle))
      .limit(1);

    const row = rows.at(0);
    if (!row) {
      return null;
    }

    const linksByUser = await this.loadLinksForUsers([row.user.id!]);
    return this.toUserDto(row, linksByUser.get(row.user.id ?? -1));
  }

  async findUserRecord(handle: string) {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.handle, handle))
      .limit(1);
    return result[0] ?? null;
  }

  async createUser(data: {
    handle: string;
    displayName: string;
    email?: string;
    passwordHash?: string;
    role?: string;
  }) {
    const [created] = await this.db
      .insert(users)
      .values({
        handle: data.handle,
        displayName: data.displayName,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role ?? 'user'
      })
      .returning();
    return created;
  }

  async updateUserMeta(handle: string, values: Partial<{ isFeatured: boolean; adLabel: string | null }>) {
    const [updated] = await this.db
      .update(users)
      .set({
        ...(values.isFeatured === undefined ? {} : { isFeatured: values.isFeatured }),
        ...(values.adLabel === undefined ? {} : { adLabel: values.adLabel })
      })
      .where(eq(users.handle, handle))
      .returning();
    return updated;
  }

  async updateProfile(userId: number, payload: UpdateUserProfilePayload) {
    const upsertPayload = {
      userId,
      verificationStatus: payload.verificationStatus ?? 'pending',
      pSize: payload.pSize,
      fSize: payload.fSize,
      age: payload.age,
      height: payload.height,
      weight: payload.weight,
      wechatQrUrl: payload.wechatQrUrl,
      groupQrUrl: payload.groupQrUrl,
      extra: payload.extra ?? null,
      notes: payload.notes,
      qrAccess: payload.qrAccess ?? false,
      positionTop: payload.topPosition,
      positionBottom: payload.bottomPosition,
      positionVers: payload.versPosition,
      positionSide: payload.sidePreference,
      positionHide: payload.hidePosition ? 1 : 0,
      features: payload.features ?? null
    };

    const shouldUpdateVerification =
      payload.verificationStatus && payload.verificationStatus !== 'pending';

    await this.db
      .insert(userProfiles)
      .values(upsertPayload)
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: {
          ...upsertPayload,
          qrAccess:
            typeof payload.qrAccess === 'boolean'
              ? payload.qrAccess
              : userProfiles.qrAccess,
          updatedAt: sql`CURRENT_TIMESTAMP`,
          ...(shouldUpdateVerification
            ? { verifiedAt: sql`CURRENT_TIMESTAMP` }
            : {})
        }
      });

    return this.getUserById(userId);
  }

  private async getUserById(userId: number) {
    const rows = await this.db
      .select({
        user: users,
        profile: userProfiles
      })
      .from(users)
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(eq(users.id, userId))
      .limit(1);

    const row = rows.at(0);
    if (!row) {
      return null;
    }

    const linksByUser = await this.loadLinksForUsers([userId]);
    return this.toUserDto(row, linksByUser.get(userId));
  }

  private async loadLinksForUsers(userIds: number[]) {
    if (userIds.length === 0) {
      return new Map<number, ReturnType<UserRepository['mapLink']>[]>();
    }

    const joined = await this.db
      .select({
        link: links,
        type: linkTypes
      })
      .from(links)
      .leftJoin(linkTypes, eq(linkTypes.id, links.typeId))
      .where(inArray(links.userId, userIds))
      .orderBy(asc(links.order), desc(links.createdAt));

    const linkMap = new Map<number, ReturnType<UserRepository['mapLink']>[]>();

    for (const row of joined) {
      const ownerId = row.link.userId!;
      const mapped = this.mapLink(row);
      const existing = linkMap.get(ownerId) ?? [];
      existing.push(mapped);
      linkMap.set(ownerId, existing);
    }

    return linkMap;
  }

  private toUserDto(row: JoinedUserRow, userLinks?: ReturnType<UserRepository['mapLink']>[]) {
    const { user, profile } = row;

    return {
      id: user.id!,
      handle: user.handle!,
      displayName: user.displayName!,
      email: user.email ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
      bio: user.bio ?? undefined,
      isFeatured: Boolean(user.isFeatured),
      adLabel: user.adLabel ?? undefined,
      role: user.role ?? undefined,
      profile: profile
        ? {
            verificationStatus: profile.verificationStatus,
            pSize: profile.pSize ?? undefined,
            fSize: profile.fSize ?? undefined,
            age: profile.age ?? undefined,
            height: profile.height ?? undefined,
            weight: profile.weight ?? undefined,
            wechatQrUrl: profile.wechatQrUrl ?? undefined,
            groupQrUrl: profile.groupQrUrl ?? undefined,
            extra: profile.extra ?? undefined,
            verifiedBy: profile.verifiedBy ?? undefined,
            verifiedAt: profile.verifiedAt ?? undefined,
            notes: profile.notes ?? undefined,
            qrAccess: Boolean(profile.qrAccess),
            topPosition: profile.positionTop ?? undefined,
            bottomPosition: profile.positionBottom ?? undefined,
            versPosition: profile.positionVers ?? undefined,
            sidePreference: profile.positionSide ?? undefined,
            hidePosition: Boolean(profile.positionHide),
            features: profile.features ?? undefined
          }
        : undefined,
      links: userLinks,
      createdAt: user.createdAt ?? undefined,
      updatedAt: user.updatedAt ?? undefined
    } satisfies UserDTO;
  }

  private mapLink(row: JoinedLinkRow) {
    return {
      id: row.link.id!,
      title: row.link.title!,
      url: row.link.url!,
      order: row.link.order ?? 0,
      isHidden: Boolean(row.link.isHidden),
      clicks: row.link.clicks ?? 0,
      metadata: row.link.metadata ?? undefined,
      createdAt: row.link.createdAt ?? undefined,
      updatedAt: row.link.updatedAt ?? undefined,
      type: row.type
        ? {
            id: row.type.id!,
            slug: row.type.slug!,
            label: row.type.label!,
            description: row.type.description ?? undefined
          }
        : undefined
    };
  }
}
