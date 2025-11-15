import type { Context, Hono } from 'hono';
import { RESOURCE_IDS } from '@gmgncard/config';
import type { AppBindings } from '../types';

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="cf" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop stop-color="#6366F1" offset="0%"/>
      <stop stop-color="#22D3EE" offset="100%"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#cf)"/>
  <text x="50%" y="50%" fill="#0F172A" font-family="Inter, sans-serif" font-size="26" font-weight="700" text-anchor="middle" dominant-baseline="central">GC</text>
</svg>`;

const serveR2Object = async (c: Context<AppBindings>, key: string) => {
  const bucket = c.env[RESOURCE_IDS.r2];
  if (!bucket) {
    return c.notFound();
  }
  const object = await bucket.get(key);
  if (!object) {
    return c.notFound();
  }
  return new Response(object.body, {
    headers: {
      'content-type': object.httpMetadata?.contentType ?? 'application/octet-stream',
      'cache-control': 'public, max-age=14400'
    }
  });
};

export const registerStaticRoutes = (app: Hono<AppBindings>) => {
  app.get('/favicon.svg', (c) =>
    new Response(faviconSvg, {
      headers: {
        'content-type': 'image/svg+xml',
        'cache-control': 'public, max-age=86400'
      }
    })
  );

  app.get('/cdn/qr/:handle/:asset', (c) => {
    const key = `qr/${c.req.param('handle')}/${c.req.param('asset')}`;
    return serveR2Object(c, key);
  });

  app.get('/cdn/avatars/:handle/:asset', (c) => {
    const key = `avatars/${c.req.param('handle')}/${c.req.param('asset')}`;
    return serveR2Object(c, key);
  });
};
