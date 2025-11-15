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

按顺序执行所有未应用的 SQL（生产环境去掉 `--local`）：

```bash
pnpm migrate        # 默认执行远端迁移
pnpm migrate:local  # 在本地环境执行（带 --local）
```

> 建议在 PR/部署前运行 `pnpm smoke` 验证迁移后的 Worker 仍可访问。

## 4. Secrets 与环境变量

| 键名 | 用途 | 获取方式 / 备注 |
| --- | --- | --- |
| `JWT_SECRET` | Worker 签发/验证 JWT | 生成 32+ 字节随机字符串（`openssl rand -hex 32`），本地放 `.dev.vars`，生产用 `wrangler secret put JWT_SECRET` |
| `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET` | 表单验证码（可选） | Cloudflare Dashboard → Turnstile 创建站点获得；若暂未启用，设为 `disabled` |
| `CF_ACCESS_AUD` / `CF_ACCESS_TEAM` | Cloudflare Access 校验（可选） | Access 应用详情页复制 AUD 与 Team Domain；若未启用 Access，可置空 |
| `CORS_ORIGINS` | 允许访问 Worker API 的来源 | 生产阶段使用统一域名，例如 `https://gay.pet` |
| `D1_DATABASE_ID` | D1 生产库 ID | Cloudflare Dashboard → D1 复制 `database_id`，部署时注入模板 |
| `KV_NAMESPACE_ID` | KV Namespace ID | Dashboard → KV 复制 ID，部署时注入模板 |
| `R2_BUCKET_NAME` | R2 bucket 名称 | Dashboard → R2 复制 bucket 名，部署时注入模板 |
| `ADMIN_BASE_URL` (Pages) | Functions proxy admin 的目标 | 设置为 Cloudflare Pages Admin 默认域或自定义域，例如 `https://gmgncard-admin.pages.dev` |
| `WORKER_BASE_URL` (Pages) | Functions proxy Worker 的目标 | 设置为 Worker 域名，例如 `https://gmgncard-worker.beg.workers.dev` |

> 可在 `infra/wrangler.prod.template.toml` 中使用 `${ENV_VAR}` 占位，部署前通过 shell 或 CI 注入环境变量。

## 5. 发布 Worker

```bash
pnpm deploy:worker:prod  # 调用 scripts/deploy-prod.sh，会基于模板生成 prod 配置
# 或手动：
# envsubst < infra/wrangler.prod.template.toml > /tmp/wrangler.prod.toml
# wrangler deploy --config /tmp/wrangler.prod.toml
```

`scripts/deploy-prod.sh` 会先跑 `pnpm build`，通过 `envsubst` 将环境变量渲染到临时 prod 配置，再执行部署。确保执行前已在终端导出上表中的环境变量。

## 6. 部署 Admin 与 Site

1. `pnpm --filter @gmgncard/admin build`，产物位于 `apps/admin/dist`。
2. 上传到 Cloudflare Pages（可通过 GitHub Actions 或 `wrangler pages deploy apps/admin/dist`）。
3. 在 Pages 项目设置 `VITE_WORKER_BASE=/api`，并添加 `ADMIN_BASE_URL`、`WORKER_BASE_URL` 环境变量供 Functions 代理使用；重新部署后即可在 `https://<custom-domain>/admin`、`/api`、`/card/@handle` 下访问。

## 7. 发布后验证

1. 运行 `pnpm smoke`，`WORKER_BASE` 指向生产域名。
2. 打开生产 Admin，使用管理员账户登录并执行一次链接操作。
3. 访问公开页面 `https://<worker-domain>/@alice` 或真实 handle，核对静态内容。

如遇异常，使用 `wrangler tail` 查看实时日志，并参考 `docs/playbooks/verification.md` 的排查步骤。***
