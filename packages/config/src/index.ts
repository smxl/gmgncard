export const RESOURCE_IDS = {
  d1: 'GMGNCARD_DB',
  r2: 'GMGNCARD_R2',
  kv: 'GMGNCARD_KV'
} as const;

export const ENV_KEYS = {
  jwtSecret: 'JWT_SECRET',
  turnstileSecret: 'TURNSTILE_SECRET',
  turnstileSiteKey: 'TURNSTILE_SITE_KEY',
  accessAudience: 'CF_ACCESS_AUD',
  accessTeam: 'CF_ACCESS_TEAM',
  corsOrigins: 'CORS_ORIGINS'
} as const;

export const REQUIRED_BINDINGS = [RESOURCE_IDS.d1, RESOURCE_IDS.kv] as const;

export const OPTIONAL_BINDINGS = [RESOURCE_IDS.r2, 'GMGNCARD_QUEUE'] as const;

export const API_ROUTES = {
  health: '/api/health',
  users: '/api/users',
  verification: '/api/verification',
  links: '/api/links',
  settings: '/api/settings',
  reports: '/api/reports'
} as const;

export const DEFAULT_SETTINGS = {
  theme: 'gmgn-default',
  accentColor: '#2F54EB',
  allowPublicProfiles: true,
  verificationRequired: true
} as const;

export const FEATURE_FLAGS = {
  enableReports: true,
  enableQrUpload: true,
  enableScheduledBackups: false
} as const;

export const TURNSTILE_ACTIONS = {
  verification: 'gmgncard-verification',
  report: 'gmgncard-report'
} as const;

export type EnvKey = keyof typeof ENV_KEYS;

export const resolveEnv = <TEnv extends Record<string, unknown>>(
  env: TEnv,
  key: EnvKey
): string => {
  const bindingName = ENV_KEYS[key];
  const value = env[bindingName];

  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing required environment variable: ${bindingName}`);
  }

  return value;
};

export const parseCorsOrigins = (raw?: string) =>
  raw
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
