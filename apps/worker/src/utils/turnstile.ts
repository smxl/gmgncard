import { HttpError } from './errors';

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
}

export const verifyTurnstileToken = async (
  token: string,
  secret: string,
  remoteIp?: string
) => {
  const body = new URLSearchParams();
  body.set('secret', secret);
  body.set('response', token);
  if (remoteIp) {
    body.set('remoteip', remoteIp);
  }

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    }
  });

  if (!response.ok) {
    throw new HttpError(502, 'Unable to verify Turnstile response');
  }

  const payload = (await response.json()) as TurnstileResponse;
  if (!payload.success) {
    throw new HttpError(
      400,
      'Turnstile verification failed',
      payload['error-codes']
    );
  }
};
