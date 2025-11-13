import { API_ROUTES } from '@gmgncard/config';
import type {
  ApiResponse,
  AuthResponse,
  CreateReportPayload,
  LinkDTO,
  LoginPayload,
  RegisterPayload,
  ReportDTO,
  ReportStatus,
  SettingsDTO,
  SettingsUpdatePayload,
  UpsertLinkPayload,
  UserDTO
} from '@gmgncard/types';

export interface HealthPayload {
  ok: boolean;
  service: string;
  status?: string;
  uptime: number;
  featureFlags: Record<string, boolean>;
  bindings: {
    d1: boolean;
    kv: boolean;
    r2: boolean;
  };
}

const API_BASE =
  (import.meta.env.VITE_WORKER_BASE as string | undefined)?.replace(/\/$/, '') ??
  '';

let authTokenGetter: (() => string | null) | null = null;

export const registerAuthTokenGetter = (getter: () => string | null) => {
  authTokenGetter = getter;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const buildUrl = (path: string) => `${API_BASE}${path}`;

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  const token = authTokenGetter?.();
  const response = await fetch(buildUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {})
    },
    ...init
  });

  const payload = (await response.json().catch(() => null)) as
    | ApiResponse<T>
    | (Record<string, unknown> & { error?: string })
    | null;

  if (!response.ok) {
    throw new ApiError(
      payload?.error ?? `Request to ${path} failed`,
      response.status,
      payload
    );
  }

  if (!payload || typeof payload !== 'object' || !('data' in payload)) {
    throw new ApiError('Malformed response payload', response.status, payload);
  }

  return payload as ApiResponse<T>;
}

const buildQuery = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      search.set(key, String(value));
    }
  });

  const queryString = search.toString();
  return queryString ? `?${queryString}` : '';
};

export const adminApi = {
  health: () => request<HealthPayload>(API_ROUTES.health),
  listUsers: (params: { limit?: number } = {}) =>
    request<UserDTO[]>(`${API_ROUTES.users}${buildQuery(params)}`),
  getSettings: () => request<SettingsDTO>(API_ROUTES.settings),
  updateSettings: (payload: SettingsUpdatePayload) =>
    request<SettingsDTO>(API_ROUTES.settings, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  login: (payload: LoginPayload) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  register: (payload: RegisterPayload) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  profile: () => request<UserDTO>('/api/auth/profile'),
  listLinks: (handle: string) => request<LinkDTO[]>(`/api/users/${handle}/links`),
  createLink: (handle: string, payload: UpsertLinkPayload) =>
    request<LinkDTO>(`/api/users/${handle}/links`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateLink: (handle: string, linkId: number, payload: UpsertLinkPayload) =>
    request<LinkDTO>(`/api/users/${handle}/links/${linkId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  deleteLink: (handle: string, linkId: number) =>
    request<{ deleted: boolean }>(`/api/users/${handle}/links/${linkId}`, {
      method: 'DELETE'
    }),
  listReports: () => request<ReportDTO[]>(API_ROUTES.reports),
  updateReportStatus: (reportId: number, status: ReportStatus) =>
    request<ReportDTO>(`${API_ROUTES.reports}/${reportId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),
  submitReport: (payload: CreateReportPayload) =>
    request<ReportDTO>(API_ROUTES.reports, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
};

export type ApiResult<T> = Awaited<ReturnType<typeof request<T>>>;
