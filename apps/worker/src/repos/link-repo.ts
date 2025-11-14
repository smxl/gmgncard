import { createDb, schema, type Database } from '@gmgncard/db';
import type { UpsertLinkPayload, LinkDTO } from '@gmgncard/types';
import { asc, eq, sql } from 'drizzle-orm';
import { RESOURCE_IDS } from '@gmgncard/config';
import type { WorkerEnv } from '../types';

const { links, linkTypes, visits } = schema;

export class LinkRepository {
  constructor(private readonly db: Database) {}

  static fromEnv(env: WorkerEnv) {
    return new LinkRepository(createDb(env[RESOURCE_IDS.d1]));
  }

  async listByUser(userId: number): Promise<LinkDTO[]> {
    const rows = await this.db
      .select({
        link: links,
        type: linkTypes
      })
      .from(links)
      .leftJoin(linkTypes, eq(linkTypes.id, links.typeId))
      .where(eq(links.userId, userId))
      .orderBy(asc(links.order));

    return rows.map(({ link, type }) => ({
      id: link.id!,
      title: link.title!,
      url: link.url!,
      order: link.order ?? 0,
      isHidden: Boolean(link.isHidden),
      clicks: link.clicks ?? 0,
      metadata: link.metadata ?? undefined,
      createdAt: link.createdAt ?? undefined,
      updatedAt: link.updatedAt ?? undefined,
      type: type
        ? {
            id: type.id!,
            slug: type.slug!,
            label: type.label!,
            description: type.description ?? undefined
          }
        : undefined
    }));
  }

  async createLink(userId: number, payload: UpsertLinkPayload) {
    const [created] = await this.db
      .insert(links)
      .values({
        userId,
        title: payload.title,
        url: payload.url,
        order: payload.order ?? 0,
        isHidden: payload.isHidden ?? false,
        typeId: payload.typeId,
        metadata: payload.metadata ?? null
      })
      .returning();

    return created;
  }

  async updateLink(linkId: number, payload: UpsertLinkPayload) {
    const [updated] = await this.db
      .update(links)
      .set({
        title: payload.title,
        url: payload.url,
        order: payload.order ?? 0,
        isHidden: payload.isHidden ?? false,
        typeId: payload.typeId,
        metadata: payload.metadata ?? null
      })
      .where(eq(links.id, linkId))
      .returning();

    return updated;
  }

  async deleteLink(linkId: number) {
    await this.db.delete(links).where(eq(links.id, linkId)).run();
  }

  async replaceLinksForUser(userId: number, payloads: UpsertLinkPayload[]) {
    await this.db.delete(links).where(eq(links.userId, userId)).run();
    if (!payloads.length) {
      return;
    }
    await this.db
      .insert(links)
      .values(
        payloads.map((payload) => ({
          userId,
          title: payload.title,
          url: payload.url,
          order: payload.order ?? 0,
          isHidden: payload.isHidden ?? false,
          typeId: payload.typeId,
          metadata: payload.metadata ?? null
        }))
      )
      .run();
  }

  async recordVisit(
    linkId: number,
    meta: { userAgent?: string; referrer?: string; country?: string }
  ) {
    await this.db
      .insert(visits)
      .values({
        linkId,
        userAgent: meta.userAgent ?? null,
        referrer: meta.referrer ?? null,
        country: meta.country ?? null
      })
      .run();

    await this.db
      .update(links)
      .set({
        clicks: sql`${links.clicks} + 1`
      })
      .where(eq(links.id, linkId))
      .run();
  }
}
