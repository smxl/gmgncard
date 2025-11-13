# GMGN Card

Cloudflare 原生的类似 Linktr.ee, LinkStack 服务。使用 pnpm workspaces 管理 Worker、Admin 与共享包。

## 开发

```bash
pnpm install         # 一次性安装所有依赖
pnpm dev:worker      # 启动 Cloudflare Worker (wrangler dev)
pnpm dev:admin       # 启动 Admin 前端 (Vite)
pnpm dev:site        # 启动公开 Landing 页 (Vite)
pnpm smoke           # 快速调用公共 API 进行冒烟检查
```

其他脚本：

- `pnpm build`：递归构建所有 workspace。
- `pnpm lint`：运行 lint（若各包定义）。

## 结构

- `apps/worker`：Workers API/SSR。
- `apps/admin`：Cloudflare Pages 管理后台。
- `packages/db`：Drizzle schema + D1 migrations。
- `packages/types`：共享 DTO / Zod schema。
- `packages/config`：资源常量、环境键名。
- `infra/`：Wrangler 配置与 CI/CD 管道。
- `docs/`：架构说明、运维手册。

更多细节见 `STRUCTURE.md`。***

## 包概览

| 包 | 职责 |
| --- | --- |
| `@gmgncard/db` | Drizzle schema、D1 数据库实例化 Helper。 |
| `@gmgncard/types` | DTO、Zod 校验与 API 响应约定。 |
| `@gmgncard/config` | Cloudflare 资源常量、默认设置与 env 读取辅助函数。 |

## API 快速预览

当前 Worker (`apps/worker`) 已提供基础 API，供 Admin 或第三方客户端调用：

| 方法 | 路径 | 描述 |
| --- | --- | --- |
| `GET /api/health` | 运行状况与绑定状态。 |
| `GET /api/users?limit=20` | 列出最新用户（含验证与链接快照）。 |
| `GET /api/users/:handle` | 单个用户详情。 |
| `PUT /api/users/:handle/profile` | 更新/审核资料、二维码链接与验证状态。 |
| `GET /api/settings` | 读取全局主题/权限配置（KV 缓存）。 |
| `PUT /api/settings` | 更新配置并写入 KV。 |
| `GET /api/reports` | 管理端拉取举报列表。 |
| `POST /api/reports` | 用户提交举报/反馈。 |
| `PATCH /api/reports/:id` | 管理端更新举报状态。 |
| `POST /api/auth/register` | 注册账号并获取 JWT。 |
| `POST /api/auth/login` | 登录获取 JWT。 |
| `GET /api/auth/profile` | 校验 token 并返回用户信息。 |
| `GET /api/users/:handle/links` | 获取指定用户的链接。 |
| `POST /api/users/:handle/links` | 创建链接（需管理员）。 |
| `PUT /api/users/:handle/links/:linkId` | 更新链接（需管理员）。 |
| `DELETE /api/users/:handle/links/:linkId` | 删除链接（需管理员）。 |

> API 响应已统一为 `{ data, meta }` 结构，并在 `meta.requestId` 中返回追踪 ID。

## Admin 前端

`apps/admin` 使用 React + React Query 构建：

- 默认通过同源的 `/api/*` 与 Worker 交互。
- 如需本地跨源调试，设置 `VITE_WORKER_BASE=http://127.0.0.1:8787` 后再运行 `pnpm dev:admin`。
- 面板已包含：Health 卡片、Settings 表单、Users 验证总览。

下一步可逐步扩展 Pages、Links、Reports 等页面，并串联 Access / Turnstile 登录态。

## Cloudflare 资源配置

1. 复制 `.dev.vars.example`（拟新增）或手动在项目根目录创建 `.dev.vars`，填入：
   ```
   JWT_SECRET=local-dev-secret
   TURNSTILE_SECRET=dummy
   TURNSTILE_SITE_KEY=dummy
   CF_ACCESS_AUD=dummy
   CF_ACCESS_TEAM=dummy
   CORS_ORIGINS=http://localhost:4173
   ```
2. 在 `infra/wrangler.toml` 更新为实际的 D1/KV/R2 绑定 ID：
   ```toml
   [[d1_databases]]
   binding = "GMGNCARD_DB"
   database_id = "<your-d1-id>"
   ```
3. 运行 `pnpm --filter @gmgncard/worker deploy --env production` 或 `wrangler deploy`.
4. Admin (Cloudflare Pages) 构建时需要 `VITE_WORKER_BASE` 指向 Worker 域名，可在 Pages 项目设置 `VITE_WORKER_BASE=https://<worker-domain>`.

> 若需要更多绑定（Queues、Durable Object、Access），统一在 `packages/config/src/index.ts` 中添加常量并在 `wrangler.toml` 声明。
