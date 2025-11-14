import type { Hono } from 'hono';
import type { AppBindings } from '../types';
import { UserService } from '../services/user-service';
import { UserRepository } from '../repos/user-repo';

const getService = (env: AppBindings['Bindings']) =>
  new UserService(UserRepository.fromEnv(env));

const svgTemplate = (user: {
  displayName: string;
  handle: string;
  profile?: {
    age?: number;
    pSize?: string;
    fSize?: string;
    height?: number;
    weight?: number;
    versPosition?: string;
    verificationStatus?: string;
  };
}) => {
  const stats: string[] = [];
  if (user.profile?.age) stats.push(`Age ${user.profile.age}`);
  if (user.profile?.height) stats.push(`${user.profile.height}cm`);
  if (user.profile?.weight) stats.push(`${user.profile.weight}kg`);
  if (user.profile?.pSize) stats.push(`P ${user.profile.pSize}`);
  if (user.profile?.fSize) stats.push(`F ${user.profile.fSize}`);
  if (user.profile?.versPosition) stats.push(user.profile.versPosition);
  if (user.profile?.verificationStatus)
    stats.push(user.profile.verificationStatus.toUpperCase());

  const statsText = stats.join(' · ') || 'GMGN Card';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop stop-color="#6366F1" offset="0%"/>
      <stop stop-color="#22D3EE" offset="100%"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" rx="36" fill="#0f172a"/>
  <rect x="40" y="40" width="1120" height="550" rx="32" fill="url(#bg)" opacity="0.3"/>
  <rect x="60" y="60" width="1080" height="510" rx="28" fill="#0f172a" opacity="0.9"/>
  <text x="90" y="180" fill="#e0e7ff" font-family="Inter, sans-serif" font-size="72" font-weight="600">
    ${escapeHtml(user.displayName)}
  </text>
  <text x="90" y="250" fill="#94a3b8" font-family="Inter, sans-serif" font-size="42">
    @${escapeHtml(user.handle)}
  </text>
  <text x="90" y="330" fill="#c7d2fe" font-family="Inter, sans-serif" font-size="34">
    ${escapeHtml(statsText)}
  </text>
  <text x="1110" y="560" fill="#38bdf8" font-family="Inter, sans-serif" font-size="32" font-weight="600" text-anchor="end">
    GMGN Card
  </text>
</svg>`;
};

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const registerOgRoutes = (app: Hono<AppBindings>) => {
  app.get('/og/:handle.svg', async (c) => {
    const service = getService(c.env);
    const user = await service.getByHandle(c.req.param('handle'));
    const svg = svgTemplate(user);
    return new Response(svg, {
      headers: {
        'content-type': 'image/svg+xml',
        'cache-control': 'public, max-age=3600'
      }
    });
  });
};
