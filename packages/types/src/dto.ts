export const verificationStatuses = ['pending', 'approved', 'rejected'] as const;
export type VerificationStatus = (typeof verificationStatuses)[number];

export const reportStatuses = ['open', 'reviewing', 'resolved', 'rejected'] as const;
export type ReportStatus = (typeof reportStatuses)[number];

export interface VerificationProfile {
  verificationStatus: VerificationStatus;
  pSize?: string;
  fSize?: string;
  age?: number;
  wechatQrUrl?: string;
  groupQrUrl?: string;
  extra?: Record<string, unknown>;
  verifiedBy?: number;
  verifiedAt?: string;
  notes?: string;
  qrAccess?: boolean;
}

export interface LinkTypeDTO {
  id: number;
  slug: string;
  label: string;
  description?: string;
}

export interface LinkDTO {
  id: number;
  title: string;
  url: string;
  order: number;
  isHidden: boolean;
  clicks: number;
  type?: LinkTypeDTO;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ButtonDTO {
  id: number;
  label: string;
  url: string;
  icon?: string;
  order: number;
}

export interface PageDTO {
  id: number;
  slug: string;
  title: string;
  theme: string;
  blocks?: Record<string, unknown>[];
  publishedAt?: string;
  updatedAt?: string;
}

export interface SettingsDTO {
  theme: string;
  accentColor: string;
  allowPublicProfiles: boolean;
  verificationRequired: boolean;
}

export interface ReportDTO {
  id: number;
  linkId?: number | null;
  reporterEmail?: string;
  reason: string;
  status: ReportStatus;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CreateReportPayload {
  linkId?: number;
  reporterEmail?: string;
  reason: string;
  metadata?: Record<string, unknown>;
}

export interface SocialAccountDTO {
  id: number;
  provider: string;
  handle: string;
  url: string;
  verified: boolean;
}

export interface UserDTO {
  id: number;
  handle: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  role?: string;
  profile?: VerificationProfile;
  links?: LinkDTO[];
  buttons?: ButtonDTO[];
  pages?: PageDTO[];
  socialAccounts?: SocialAccountDTO[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  cursor?: string;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    pagination?: Pick<PaginatedResult<T>, 'total' | 'cursor' | 'hasMore'>;
    requestId?: string;
  };
}

export interface VerificationRequestPayload {
  pSize?: string;
  fSize?: string;
  age?: number;
  wechatQrUrl?: string;
  groupQrUrl?: string;
  extra?: Record<string, unknown>;
  notes?: string;
}

export interface UpdateUserProfilePayload extends VerificationRequestPayload {
  verificationStatus?: VerificationStatus;
}

export interface UpsertLinkPayload {
  title: string;
  url: string;
  order?: number;
  isHidden?: boolean;
  typeId?: number;
  metadata?: Record<string, unknown>;
}

export interface SettingsUpdatePayload {
  theme?: string;
  accentColor?: string;
  allowPublicProfiles?: boolean;
  verificationRequired?: boolean;
}

export interface RegisterPayload {
  handle: string;
  displayName: string;
  email?: string;
  password: string;
}

export interface LoginPayload {
  handle: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserDTO;
}

export interface UpdateReportStatusPayload {
  status: ReportStatus;
}
