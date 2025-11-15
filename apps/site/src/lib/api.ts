const API_BASE =
  (import.meta.env.VITE_WORKER_BASE as string | undefined)?.replace(/\/$/, '') ||
  '';

const buildUrl = (path: string) => `${API_BASE}${path}`;

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
