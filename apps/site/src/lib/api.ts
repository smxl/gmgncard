const rawBase = (import.meta.env.VITE_WORKER_BASE as string | undefined) ?? '';
const API_BASE = rawBase.trim();

const buildUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE) {
    return normalizedPath;
  }
  const trimmedBase = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  if (/^https?:\/\//i.test(trimmedBase)) {
    return `${trimmedBase}${normalizedPath}`;
  }
  const prefixedPath = trimmedBase.startsWith('/') ? trimmedBase : `/${trimmedBase}`;
  if (normalizedPath.startsWith(prefixedPath)) {
    return normalizedPath;
  }
  return `${prefixedPath}${normalizedPath}`;
};

export interface VerificationRequestBody {
  handle: string;
  displayName: string;
  email: string;
  password: string;
  bio?: string;
  turnstileToken?: string;
  profile: {
    pSize?: string;
    fSize?: string;
    age?: number;
    height?: number;
    weight?: number;
    topPosition?: string;
    bottomPosition?: string;
    versPosition?: string;
    sidePreference?: string;
    hidePosition?: boolean;
    notes?: string;
  };
  links: { title: string; url: string }[];
}

export const submitVerificationRequest = async (payload: VerificationRequestBody) => {
  const response = await fetch(buildUrl('/api/verification'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      ...payload,
      links: payload.links.map((link, index) => ({
        title: link.title,
        url: link.url,
        order: index
      }))
    })
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error ?? '提交失败，请稍后再试');
  }
  return body?.data ?? body;
};
