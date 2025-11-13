# GMGN Card Architecture

本文档汇总当前阶段的实现重点，便于后续团队在 Cloudflare 生态中持续扩展。

## 1. Worker (apps/worker)

- 基于 **Hono**，并在 `/api` 之下暴露 REST 接口。
- 入口通过 `requestContext` 中间件为每个请求注入 `requestId`，统一 `withRequestMeta` 响应格式。
- Repository 层使用 `@gmgncard/db` 暴露的 Drizzle schema：
  - `UserRepository` 负责用户、资料、链接等查询与更新。
  - `SettingsService` 将全局配置缓存到 `GMGNCARD_KV`。
- 当前已开放的接口：
  - `GET /api/health`：返回 Workers 绑定状态、Feature Flags。
  - `GET /api/users`、`GET /api/users/:handle`：联表查询 `user_profiles`、`links` 并组装 DTO。
  - `PUT /api/users/:handle/profile`：写入 `user_profiles`（支持 `ON CONFLICT DO UPDATE`）。
  - `GET/PUT /api/settings`：统一走 KV。
  - `POST /api/auth/register` / `POST /api/auth/login` / `GET /api/auth/profile`：基于 JWT 的最小注册 & 登录。
  - `GET /@:handle`：SSR 渲染公开页面。
- 错误统一抛出 `HttpError`，`ZodError` 直接返回 400。

## 2. Admin (apps/admin)

- React + Vite + React Query，提供运行状况/配置/验证面板。
- `lib/api.ts` 约定所有调用均返回 `ApiResponse<T>`，便于在 UI 层访问 `meta.pagination`、`meta.requestId`。
- 核心组件：
  - `HealthCard`：展示 Worker 健康与 Feature Flag。
  - `UsersPanel`：列出最近用户，包含验证状态与链接一览。
  - `SettingsPanel`：编辑主题/权限配置，落地到 Worker KV。
- 通过 `VITE_WORKER_BASE` 可切换到本地 wrangler worker 或生产域名。

## 3. Shared Packages

- `@gmgncard/db`
  - 覆盖 `users`, `user_profiles`, `links`, `link_types`, `buttons`, `pages`, `settings`, `visits`, `reports`, `social_accounts`。
  - 提供 `createDb(binding)` helper，Worker 直接注入 D1。
- `@gmgncard/types`
  - DTO + Zod schema，保持 Admin/Worker 校验一致。
  - `PaginatedResult`, `ApiResponse` 统一响应形态。
- `@gmgncard/config`
  - `RESOURCE_IDS`、`ENV_KEYS`、`DEFAULT_SETTINGS`、`FEATURE_FLAGS`。
  - `resolveEnv` 与 `parseCorsOrigins` 提供 Worker 运行时校验。

## 4. 下一步

1. 为 `packages/db` 生成 D1 migrations，与 Cloudflare `wrangler d1` 集成。
2. 在 Worker 中补充 Auth、Report、Links CRUD、文件上传签名等服务。
3. Admin 侧串联 Cloudflare Access，增加 Users 审核操作、Links/Reports 视图。
4. 编写 `docs/playbooks/verification.md`、`deployment.md`，记录审核/上线流程。
