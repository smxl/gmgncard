import type { UserDTO } from '@gmgncard/types';

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const renderLinks = (user: UserDTO) => {
  if (!user.links?.length) {
    return '<p class="empty">该用户尚未添加链接。</p>';
  }

  return user.links
    .filter((link) => !link.isHidden)
    .map(
      (link) => `
        <a class="link-card" href="${link.url}" target="_blank" rel="noopener noreferrer">
          <span>${escapeHtml(link.title)}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
        </a>
      `
    )
    .join('');
};

const renderButtons = (user: UserDTO) => {
  if (!user.buttons?.length) {
    return '';
  }

  return `
    <div class="button-row">
      ${user.buttons
        .map(
          (button) => `
            <a href="${button.url}" target="_blank" rel="noopener noreferrer">
              ${escapeHtml(button.label)}
            </a>
          `
        )
        .join('')}
    </div>
  `;
};

const renderQrSection = (user: UserDTO) => {
  const qrBlocks: string[] = [];
  const profile = user.profile;
  if (!profile || !profile.qrAccess) return '';

  if (profile.wechatQrUrl) {
    qrBlocks.push(`
      <div>
        <p>微信二维码</p>
        <img src="${profile.wechatQrUrl}" alt="Wechat QR" />
      </div>
    `);
  }

  if (profile.groupQrUrl) {
    qrBlocks.push(`
      <div>
        <p>群二维码</p>
        <img src="${profile.groupQrUrl}" alt="Group QR" />
      </div>
    `);
  }

  if (!qrBlocks.length) {
    return '';
  }

  return `<section class="qr-grid">${qrBlocks.join('')}</section>`;
};

const renderStats = (user: UserDTO) => {
  const profile = user.profile;
  if (!profile) return '';

  const items: string[] = [];
  if (profile.pSize) items.push(`<li>Top: ${escapeHtml(profile.pSize)}</li>`);
  if (profile.fSize) items.push(`<li>Bottom: ${escapeHtml(profile.fSize)}</li>`);
  if (profile.age) items.push(`<li>Age: ${profile.age}</li>`);
  if (profile.topPosition) items.push(`<li>Top pref: ${escapeHtml(profile.topPosition)}</li>`);
  if (profile.bottomPosition) items.push(`<li>Bottom pref: ${escapeHtml(profile.bottomPosition)}</li>`);
  if (profile.sidePreference) items.push(`<li>Side: ${escapeHtml(profile.sidePreference)}</li>`);

  if (!items.length) return '';

  return `
    <section class="stats">
      <h3>Profile</h3>
      <ul>${items.join('')}</ul>
    </section>
  `;
};

export const renderProfilePage = (user: UserDTO) => `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(user.displayName)} · GMGN Card</title>
    <style>
      :root {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: #0f172a;
        background: #f4f6fb;
      }
      body {
        margin: 0;
        min-height: 100vh;
        background: linear-gradient(180deg,#e0e7ff,#f8fafc);
      }
      .page {
        max-width: 560px;
        margin: 0 auto;
        padding: 3rem 1.5rem;
      }
      .card {
        border-radius: 28px;
        padding: 2.5rem;
        background: rgba(255,255,255,0.85);
        box-shadow: 0 30px 70px rgba(15,23,42,0.12);
        border: 1px solid rgba(148,163,184,0.18);
        backdrop-filter: blur(14px);
      }
      .avatar {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        object-fit: cover;
        border: 4px solid rgba(79,70,229,0.2);
        margin-bottom: 1.5rem;
      }
      h1 {
        margin: 0;
        font-size: 2rem;
        color: #0f172a;
      }
      .handle {
        margin: 0.25rem 0 1rem;
        color: #6366f1;
      }
      .bio {
        color: #475569;
        line-height: 1.6;
        margin-bottom: 1.5rem;
      }
      .link-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.3rem;
        margin-bottom: 0.75rem;
        border-radius: 14px;
        background: #0f172a;
        color: white;
        text-decoration: none;
        font-weight: 600;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .link-card svg {
        width: 20px;
        height: 20px;
        fill: currentColor;
      }
      .link-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 24px rgba(15,23,42,0.25);
      }
      .button-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
      }
      .button-row a {
        flex: 1;
        min-width: 120px;
        text-align: center;
        padding: 0.6rem 0.8rem;
        border-radius: 999px;
        border: 1px solid rgba(99,102,241,0.3);
        color: #6366f1;
        text-decoration: none;
        font-weight: 600;
      }
      .qr-grid {
        margin-top: 1.5rem;
        display: grid;
        grid-template-columns: repeat(auto-fit,minmax(180px,1fr));
        gap: 1rem;
      }
      .qr-grid img {
        width: 100%;
        border-radius: 14px;
        border: 1px solid rgba(148,163,184,0.3);
      }
      .stats {
        margin: 1.5rem 0;
        padding: 1rem;
        border-radius: 14px;
        background: rgba(99,102,241,0.08);
      }
      .stats ul {
        list-style: none;
        padding: 0;
        margin: 0.5rem 0 0;
        color: #475569;
      }
      .stats li + li {
        margin-top: 0.35rem;
      }
      .empty {
        text-align: center;
        color: #94a3b8;
        padding: 1rem 0;
      }
      footer {
        margin-top: 2.5rem;
        text-align: center;
        color: #94a3b8;
      }
      @media (max-width: 640px) {
        .card {
          padding: 1.8rem;
        }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <article class="card">
        ${
          user.avatarUrl
            ? `<img class="avatar" src="${user.avatarUrl}" alt="${escapeHtml(user.displayName)}" />`
            : ''
        }
        <h1>${escapeHtml(user.displayName)}</h1>
        <p class="handle">@${escapeHtml(user.handle)}</p>
        ${user.bio ? `<p class="bio">${escapeHtml(user.bio)}</p>` : ''}
        ${renderButtons(user)}
        ${renderStats(user)}
        ${renderLinks(user)}
        ${renderQrSection(user)}
      </article>
      <footer>
        Powered by GMGN Card
      </footer>
    </div>
  </body>
</html>`;

export const renderNotFoundPage = (handle: string) => `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(handle)} 未找到 · GMGN Card</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: #0f172a;
        color: white;
      }
      .panel {
        text-align: center;
        padding: 2rem;
        border-radius: 18px;
        background: rgba(15,23,42,0.85);
        border: 1px solid rgba(148,163,184,0.2);
        width: min(420px, 90vw);
      }
      a {
        color: #818cf8;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <div class="panel">
      <h1>404</h1>
      <p>未找到 @${escapeHtml(handle)} 的页面</p>
      <a href="/">返回首页</a>
    </div>
  </body>
</html>`;
