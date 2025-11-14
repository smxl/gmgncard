import type { Hono } from 'hono';
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

export const registerStaticRoutes = (app: Hono<AppBindings>) => {
  app.get('/favicon.svg', (c) =>
    new Response(faviconSvg, {
      headers: {
        'content-type': 'image/svg+xml',
        'cache-control': 'public, max-age=86400'
      }
    })
  );

  app.get('/cdn/qr/:handle/:asset', async (c) => {
    const bucket = c.env[RESOURCE_IDS.r2];
    if (!bucket) {
      return c.notFound();
    }
    const key = `qr/${c.req.param('handle')}/${c.req.param('asset')}`;
    const object = await bucket.get(key);
    if (!object) {
      return c.notFound();
    }
    return new Response(object.body, {
      headers: {
        'content-type': object.httpMetadata?.contentType ?? 'image/png',
        'cache-control': 'public, max-age=14400'
      }
    });
  });
};
