# gmgncard Cloudflare Project Structure

> 角色：项目管理  
> 目标：让 GMGN 在 Cloudflare 生态上易于开发、部署、审核与扩展，并支持后续如微信/群二维码等自定义资料能力。

---

## 1. 项目目标

- **Cloudflare 原生**：Workers 提供 API/SSR，Pages 负责前端，D1/R2/KV/Queues/Access/Turnstile 等资源统一管理。
- **可扩展资料模型**：用 `user_profiles` 与 `extra` 字段支持验证状态、尺寸信息、微信/群二维码等。
- **多团队协作**：apps / packages / infra 的目录划分清晰，方便后续并行开发与 CI。

---

## 2. 顶层布局

```
gmgncard/
├─ apps/
│  ├─ worker/            # Cloudflare Worker：API、SSR 入口
│  └─ admin/             # Pages 前端：管理后台 & 设置
├─ packages/
│  ├─ db/                # Drizzle schema & D1 迁移
│  ├─ types/             # DTO、Zod 校验、API 客户端
│  └─ config/            # Wrangler 环境片段、共享常量
├─ infra/
│  ├─ wrangler.toml      # 资源绑定、环境、变体
│  └─ pipelines/         # GitHub Actions / Pages Pipeline
└─ docs/
   ├─ architecture.md    # 架构细节 & 决策
   └─ playbooks/         # 运维/审核流程
```

命名规范：
- `apps/*/src` 统一包含 `routes`, `services`, `repos`, `schemas`, `lib`。
- 所有环境变量、资源标识在 `infra/wrangler.toml` 与 `.dev.vars` 中声明，避免散落。

---

## 3. 应用职责

### apps/worker
```
src/
├─ routes/                 # `/api`, `/@handle`, `/panel/*`
├─ services/
│   ├─ AuthService         # JWT + Access/OAuth
│   ├─ UserService         # 资料、验证、微信/群二维码字段
│   ├─ LinkService         # 链接 CRUD、排序、点击统计
│   ├─ ThemeService        # 主题 & 块资源（R2）
│   ├─ SettingsService     # 站点配置
│   ├─ ReportService       # 举报/反馈（含 Turnstile）
│   └─ BackupService       # 队列 + Cron 备份
├─ repos/                  # Drizzle 查询封装
├─ schemas/                # Zod 校验
├─ middleware/             # 认证、速率限制、缓存
└─ utils/                  # R2 签名、KV、错误处理
```
- Worker 负责生成 R2 上传 URL，写入 `user_profiles.extra.wechat_qr_url`、`group_qr_url` 等字段。
- 统计写入 KV / Durable Object 缓冲，再批量落 D1。
- Cron & Queue Worker 位于同目录，复用服务层。

### apps/admin
- 技术栈：React + Vite 或 SvelteKit。
- 页面：Auth、Dashboard、Users（含验证/二维码）、Links、Themes、Settings。
- 与 Worker 通信统一走 `packages/types` 提供的 API 客户端；Access 保护 + JWT Session。
- Turnstile 应用于公开入口（验证申请、举报等）。

---

## 4. 共享包

| 包 | 说明 |
| --- | --- |
| `packages/db` | Drizzle schema、`migrations/*.sql`、`seed/`（按钮/主题/页面），`pnpm drizzle-kit generate` + `wrangler d1 migrations apply`。 |
| `packages/types` | DTO、Zod 验证、API 客户端，前后端共用（避免重复定义）。 |
| `packages/config` | 环境常量、资源名称、默认配置（e.g. R2 bucket 名、KV namespace）。 |

---

## 5. 数据模型摘要

核心表（D1）：
- `users`
- `user_profiles`：`verification_status`, `p_size`, `f_size`, `age`, `extra JSON`, `wechat_qr_url`, `group_qr_url`, `verified_by`, `verified_at`, `notes`
- `links`, `buttons`, `pages`, `link_types`, `settings`, `visits`, `reports`, `social_accounts`

说明：
- `extra` 允许继续扩展自定义字段，Worker & Admin UI 可自动读取配置渲染表单。
- 主题/块资源列表可存 `settings` 或单独表，由 `ThemeService` 提供。

---

## 6. Cloudflare 资源

| 资源              | 用途 |
| ----------------- | ---- |
| D1 `gmgncard-db`  | 主数据库 |
| R2 `gmgncard-r2`  | 头像、背景、主题包、微信/群二维码、备份 |
| KV `gmgncard-kv`  | 配置缓存、热门页面、临时验证状态 |
| Queues            | 邮件派发、备份、统计异步任务 |
| Cron Triggers     | 每日备份、统计聚合、清理过期验证请求 |
| Durable Objects   | 高频写入（可选） |
| Turnstile         | 验证表单、防刷 |
| Access            | 管理面板入口 |

所有绑定在 `infra/wrangler.toml` 内集中描述，便于审计。

---

## 7. 用户验证 & 二维码支持流程

1. **用户提交**：在前端填写验证信息、上传微信/群二维码图（R2 直传），Worker 将 URL 存入 `user_profiles.wechat_qr_url` / `group_qr_url`。
2. **管理员审核**：`apps/admin` 的 Users/Verification 页面列出 `pending` 记录，可编辑各字段并设置 `verification_status`。
3. **展示策略**：Worker 在生成 `@handle` 页或 API 响应时，仅在 `status=approved` 时暴露二维码信息，可附带遮罩（需登录可见）。
4. **扩展**：`extra` 字段可放置更多社交二维码或校验资料，无需调整 schema。

---

## 8. 运行与交付流程

- 开发：`wrangler dev`（Worker）+ `pnpm dev --filter apps/admin`。
- CI：GitHub Actions / Pipelines
  1. Lint/Test → Build → `wrangler publish`（Worker）
  2. Build → Cloudflare Pages Deploy（admin）
- 迁移：`pnpm drizzle-kit generate` → `wrangler d1 migrations apply gmgncard-db --env <env>`
- 备份：Cron Worker 导出 D1 + R2 清单 → 存 R2 `backups/`。
- 监控：Workers Trace Events、Logpush、Sentry（可选）。

---

## 9. 路线与下一步

1. 搭建 `packages/db` schema 与基础迁移（含 `user_profiles`、二维码字段）。
2. 初始化 `apps/worker`，完成 Auth、User、Link 基础路由。
3. 开发 `apps/admin` 验证/二维码管理界面。
4. 配置 Cloudflare 资源绑定 & 环境变量（Access、Turnstile、R2、KV）。
5. 落地 Cron/Queue 任务（备份、通知、统计）。

> 完成以上步骤后，可逐步替换旧版 Laravel 部署，并支持用户自定义的微信/群二维码等扩展场景。
