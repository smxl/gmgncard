# Deployment Playbook

## 1. 准备环境

1. 安装 Node 18+、pnpm（`corepack enable`）。
2. 登录 Cloudflare：`npx wrangler login`。
3. 确认 `infra/wrangler.toml` 中的资源 ID 与 Cloudflare 控制台一致。

## 2. 本地检查

```bash
pnpm install
pnpm lint
pnpm build
pnpm smoke            # 确保 Worker API 正常
```

可选：在 `.dev.vars` 中补充生产变量并运行 `pnpm dev:worker` + `pnpm dev:admin` 进行联调。

## 3. 数据迁移

在每次 schema 更新后，必须：

```bash
wrangler d1 execute gmgncard-db --config infra/wrangler.toml --file packages/db/migrations/000X_xxx.sql
```

按顺序执行所有未应用的 SQL，生产环境去掉 `--local`。

## 4. 发布 Worker

```bash
pnpm --filter @gmgncard/worker deploy
# 或
wrangler deploy --config infra/wrangler.toml
```

Wrangler 会使用 `main = "../apps/worker/src/index.ts"` 生成最新 bundle，并绑定 D1/KV/R2。

## 5. 部署 Admin

1. `pnpm --filter @gmgncard/admin build`，产物位于 `apps/admin/dist`。
2. 上传到 Cloudflare Pages（可通过 GitHub Actions 或 `wrangler pages deploy apps/admin/dist`）。
3. 在 Pages 项目设置 `VITE_WORKER_BASE=https://<worker-domain>`，等待构建完成。

## 6. 发布后验证

1. 运行 `pnpm smoke`，`WORKER_BASE` 指向生产域名。
2. 打开生产 Admin，使用管理员账户登录并执行一次链接操作。
3. 访问公开页面 `https://<worker-domain>/@alice` 或真实 handle，核对静态内容。

如遇异常，使用 `wrangler tail` 查看实时日志，并参考 `docs/playbooks/verification.md` 的排查步骤。***
