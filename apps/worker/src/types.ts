import type { Queue } from '@cloudflare/workers-types';
import type { QueueJob } from './jobs/types';

export interface WorkerEnv {
  GMGNCARD_DB: D1Database;
  GMGNCARD_KV: KVNamespace;
  GMGNCARD_R2?: R2Bucket;
  GMGNCARD_QUEUE?: Queue<QueueJob>;
  JWT_SECRET: string;
  TURNSTILE_SECRET: string;
  TURNSTILE_SITE_KEY: string;
  CF_ACCESS_AUD: string;
  CF_ACCESS_TEAM: string;
  CORS_ORIGINS?: string;
}

export interface AppVariables {
  requestId: string;
  authUser?: {
    id: number;
    handle: string;
    role?: string;
  };
}

export type AppBindings = {
  Bindings: WorkerEnv;
  Variables: AppVariables;
};
