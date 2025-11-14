import type { UserDTO } from '@gmgncard/types';

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const renderLinks = (user: UserDTO) => {
  if (!user.links?.length) {
    return '<p class="empty">该用户尚未添加链接。</p>';
  }

  const links = user.links
    .filter((link) => !link.isHidden)
    .map(
      (link) => `
        <a class="link-card" data-link-id="${link.id}" data-handle="${user.handle}" href="${link.url}" target="_blank" rel="noopener noreferrer">
          <span>${escapeHtml(link.title)}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
        </a>
      `
    )
    .join('');

  return `<div class="links-stack">${links}</div>`;
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

const buildChipGroups = (user: UserDTO) => {
  const profile = user.profile;
  if (!profile) {
    return { major: [] as string[], minor: [] as string[] };
  }

  const major: string[] = [];
  const minor: string[] = [];
  const positionParts: string[] = [];

  if (profile.pSize) major.push(`Cock ${profile.pSize}`);
  if (profile.fSize) major.push(`Foot ${profile.fSize}`);

  if (profile.topPosition) positionParts.push('Top');
  if (profile.versPosition) positionParts.push('Vers');
  if (profile.bottomPosition) positionParts.push('Bottom');
  if (profile.sidePreference) positionParts.push('Side');
  if (profile.hidePosition) positionParts.push('Hidden');
  if (positionParts.length) {
    major.push(`Position ${positionParts.join(' / ')}`);
  }

  if (profile.age) minor.push(`Age ${profile.age}`);
  if (profile.height) minor.push(`Height ${profile.height} cm`);
  if (profile.weight) minor.push(`Weight ${profile.weight} kg`);

  return { major, minor };
};

const renderHeroStats = (user: UserDTO) => {
  const { major } = buildChipGroups(user);
  if (!major.length) return '';
  const profile = user.profile;
  const hasOtherPositions =
    Boolean(profile?.topPosition || profile?.versPosition || profile?.bottomPosition || profile?.hidePosition);
  return `
    <ul class="hero-stats">
      ${major
        .map((chip) => {
          const isPosition = chip.startsWith('Position');
          const showSideNote = isPosition && profile?.sidePreference && hasOtherPositions;
          const sideText = showSideNote ? `<small>Side ${escapeHtml(profile!.sidePreference!)}</small>` : '';
          return `
            <li>
              <strong>${escapeHtml(chip)}</strong>
              ${sideText}
            </li>
          `;
        })
        .join('')}
    </ul>
  `;
};

const renderPreferenceChips = (user: UserDTO) => {
  const chips = buildChipGroups(user).minor;
  if (!chips.length) return '';
  return `
    <div class="minor-chips">
      ${chips.map((chip) => `<span>${escapeHtml(chip)}</span>`).join('')}
    </div>
  `;
};

const renderContentSections = (user: UserDTO) => {
  return `${renderQrSection(user)}${renderLinks(user)}`;
};

const buildOgDescription = (user: UserDTO) => {
  const profile = user.profile;
  if (!profile) {
    return `${user.displayName} on GMGN Card`;
  }
  const parts: string[] = [];
  if (profile.age) parts.push(`Age ${profile.age}`);
  if (profile.height) parts.push(`${profile.height}cm`);
  if (profile.weight) parts.push(`${profile.weight}kg`);
  if (profile.pSize) parts.push(`Penis ${profile.pSize}`);
  if (profile.fSize) parts.push(`Foot ${profile.fSize}`);
  if (profile.versPosition) parts.push(profile.versPosition);
  if (profile.verificationStatus) parts.push(profile.verificationStatus);
  return parts.join(' · ') || `${user.displayName} on GMGN Card`;
};

export const renderProfilePage = (user: UserDTO) => {
  const ogDescription = buildOgDescription(user);
  const ogImage = `/og/${encodeURIComponent(user.handle)}.svg`;
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(user.displayName)} · GMGN Card</title>
    <link rel="icon" href="/favicon.svg" />
    <meta property="og:title" content="${escapeHtml(user.displayName)} · @${escapeHtml(user.handle)}" />
    <meta property="og:description" content="${escapeHtml(ogDescription)}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:type" content="profile" />
    <meta property="og:site_name" content="GMGN Card" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(user.displayName)}" />
    <meta name="twitter:description" content="${escapeHtml(ogDescription)}" />
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
        padding: 2rem;
        background: rgba(255,255,255,0.85);
        box-shadow: 0 30px 70px rgba(15,23,42,0.12);
        border: 1px solid rgba(148,163,184,0.18);
        backdrop-filter: blur(14px);
      }
      .profile-header {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        margin-bottom: 1rem;
      }
      .avatar {
        width: 120px;
        height: 120px;
        border-radius: 32px;
        object-fit: cover;
        border: 4px solid rgba(79,70,229,0.2);
        box-shadow: 0 20px 40px rgba(79,70,229,0.25);
      }
      h1 {
        margin: 0;
        font-size: 2rem;
        color: #0f172a;
      }
      .identity {
        display: flex;
        align-items: center;
        gap: 0.6rem;
      }
      .handle {
        margin: 0.25rem 0 1rem;
        color: #6366f1;
      }
      .badge {
        padding: 0.2rem 0.7rem;
        border-radius: 999px;
        font-size: 0.75rem;
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.04em;
      }
      .badge-verified {
        background: rgba(34,197,94,0.15);
        color: #16a34a;
        border: 1px solid rgba(34,197,94,0.3);
      }
      .badge-pending {
        background: rgba(250,204,21,0.15);
        color: #ca8a04;
        border: 1px solid rgba(250,204,21,0.3);
      }
      .bio {
        color: #475569;
        line-height: 1.5;
        margin-bottom: 1rem;
      }
      .hero-stats {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        list-style: none;
        padding: 0;
        margin: 0 0 1rem;
      }
      .hero-stats li {
        padding: 0.6rem 0.9rem;
        border-radius: 16px;
        background: rgba(99,102,241,0.08);
        border: 1px solid rgba(99,102,241,0.2);
        flex: 1 1 130px;
      }
      .hero-stats strong {
        font-size: 1.25rem;
        color: #0f172a;
      }
      .minor-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin-bottom: 1rem;
      }
      .minor-chips span {
        padding: 0.25rem 0.65rem;
        border-radius: 16px;
        border: 1px solid rgba(148,163,184,0.3);
        background: rgba(247,248,252,0.9);
        font-size: 0.8rem;
        color: #475569;
      }
      .links-stack {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .link-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.85rem 1rem;
        border-radius: 13px;
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
        gap: 0.5rem;
        margin-bottom: 1rem;
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
        margin-top: 1rem;
        display: grid;
        grid-template-columns: repeat(auto-fit,minmax(150px,1fr));
        gap: 0.75rem;
      }
      .qr-grid img {
        width: 100%;
        border-radius: 14px;
        border: 1px solid rgba(148,163,184,0.3);
      }
      .empty {
        text-align: center;
        color: #94a3b8;
        padding: 0.75rem 0;
      }
      footer {
        margin-top: 2.5rem;
        text-align: center;
        color: #94a3b8;
      }
      @media (max-width: 640px) {
        .card {
          padding: 1.6rem;
        }
        .profile-header {
          flex-direction: column;
          align-items: flex-start;
        }
        .hero-stats {
          flex-direction: column;
        }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <article class="card">
        <div class="profile-header">
          ${
            user.avatarUrl
              ? `<img class="avatar" src="${user.avatarUrl}" alt="${escapeHtml(user.displayName)}" />`
              : ''
          }
          <div>
            <div class="identity">
              <h1>${escapeHtml(user.displayName)}</h1>
              ${
                user.profile?.verificationStatus === 'approved'
                  ? '<span class="badge badge-verified">Verified</span>'
                  : user.profile?.verificationStatus
                    ? `<span class="badge badge-pending">${escapeHtml(
                        user.profile.verificationStatus
                      )}</span>`
                    : ''
              }
            </div>
            <p class="handle">@${escapeHtml(user.handle)}</p>
            ${renderHeroStats(user)}
            ${renderPreferenceChips(user)}
          </div>
        </div>
        ${user.bio ? `<p class="bio">${escapeHtml(user.bio)}</p>` : ''}
        ${renderButtons(user)}
        ${renderContentSections(user)}
      </article>
      <footer>
        Powered by GMGN Card
      </footer>
    </div>
    <script>
    (() => {
      const endpoint = '/api/metrics/links';
      const supportsBeacon = typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function';
      if (!supportsBeacon) return;
      document.querySelectorAll('.link-card').forEach((el) => {
        el.addEventListener('click', () => {
          const linkId = el.getAttribute('data-link-id');
          if (!linkId) return;
          const payload = JSON.stringify({
            linkId,
            handle: el.getAttribute('data-handle')
          });
          navigator.sendBeacon(
            endpoint,
            new Blob([payload], { type: 'application/json' })
          );
        });
      });
    })();
  </script>
  </body>
</html>`;
};

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
