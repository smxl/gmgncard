import { upsertLinkSchema } from '@gmgncard/types';
import type { LinkDTO, UpsertLinkPayload } from '@gmgncard/types';
import { LinkRepository } from '../repos/link-repo';
import { UserRepository } from '../repos/user-repo';
import { HttpError } from '../utils/errors';

export class LinkService {
  constructor(
    private readonly linkRepo: LinkRepository,
    private readonly userRepo: UserRepository
  ) {}

  async list(handle: string): Promise<LinkDTO[]> {
    const user = await this.userRepo.findByHandle(handle);
    if (!user) {
      throw new HttpError(404, `User ${handle} not found`);
    }
    return this.linkRepo.listByUser(user.id);
  }

  async create(handle: string, payload: UpsertLinkPayload) {
    const data = upsertLinkSchema.parse(payload);
    const userRecord = await this.userRepo.findUserRecord(handle);
    if (!userRecord) {
      throw new HttpError(404, `User ${handle} not found`);
    }
    const created = await this.linkRepo.createLink(userRecord.id!, data);
    return this.linkRepo.listByUser(userRecord.id!).then((list) =>
      list.find((link) => link.id === created.id)!
    );
  }

  async update(handle: string, linkId: number, payload: UpsertLinkPayload) {
    const data = upsertLinkSchema.parse(payload);
    const userRecord = await this.userRepo.findUserRecord(handle);
    if (!userRecord) {
      throw new HttpError(404, `User ${handle} not found`);
    }

    const updated = await this.linkRepo.updateLink(linkId, data);
    if (!updated) {
      throw new HttpError(404, `Link ${linkId} not found`);
    }

    return this.linkRepo.listByUser(userRecord.id!).then((list) =>
      list.find((link) => link.id === updated.id)!
    );
  }

  async delete(handle: string, linkId: number) {
    const userRecord = await this.userRepo.findUserRecord(handle);
    if (!userRecord) {
      throw new HttpError(404, `User ${handle} not found`);
    }
    await this.linkRepo.deleteLink(linkId);
  }
}
