export interface WorkerEnv {
  GMGNCARD_DB: D1Database;
  GMGNCARD_KV: KVNamespace;
  GMGNCARD_R2?: R2Bucket;
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
