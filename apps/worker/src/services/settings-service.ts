import { DEFAULT_SETTINGS } from '@gmgncard/config';
import type { SettingsDTO, SettingsUpdatePayload } from '@gmgncard/types';
import { settingsUpdateSchema } from '@gmgncard/types';

const SETTINGS_KV_KEY = 'gmgncard:settings';

export class SettingsService {
  constructor(private readonly kv: KVNamespace) {}

  async getSettings(): Promise<SettingsDTO> {
    const cached = await this.kv.get<SettingsDTO>(SETTINGS_KV_KEY, 'json');
    return {
      ...DEFAULT_SETTINGS,
      ...cached
    };
  }

  async updateSettings(payload: SettingsUpdatePayload): Promise<SettingsDTO> {
    const parsed = settingsUpdateSchema.parse(payload);
    const next = {
      ...(await this.getSettings()),
      ...parsed
    };

    await this.kv.put(SETTINGS_KV_KEY, JSON.stringify(next));
    return next;
  }
}
