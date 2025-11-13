const encoder = new TextEncoder();

const base64UrlEncode = (data: ArrayBuffer | Uint8Array) =>
  btoa(
    String.fromCharCode(...new Uint8Array(data instanceof ArrayBuffer ? new Uint8Array(data) : data))
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const base64UrlDecode = (str: string) => {
  const normalized = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Uint8Array.from(atob(normalized + pad), (c) => c.charCodeAt(0));
};

export interface JwtPayload {
  sub: string;
  exp: number;
  [key: string]: unknown;
}

export const signJwt = async (
  payload: Record<string, unknown>,
  secret: string,
  expiresInSeconds = 60 * 60 * 24
) => {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp };

  const headerPart = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const payloadPart = base64UrlEncode(encoder.encode(JSON.stringify(fullPayload)));
  const data = `${headerPart}.${payloadPart}`;

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const signaturePart = base64UrlEncode(signature);

  return `${data}.${signaturePart}`;
};

export const verifyJwt = async <TPayload extends JwtPayload = JwtPayload>(
  token: string,
  secret: string
): Promise<TPayload> => {
  const [headerPart, payloadPart, signaturePart] = token.split('.');
  if (!headerPart || !payloadPart || !signaturePart) {
    throw new Error('Invalid token');
  }
  const data = `${headerPart}.${payloadPart}`;
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signature = base64UrlDecode(signaturePart);
  const isValid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(data));
  if (!isValid) {
    throw new Error('Invalid signature');
  }

  const payload = JSON.parse(
    new TextDecoder().decode(base64UrlDecode(payloadPart))
  ) as TPayload;

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }

  return payload;
};
