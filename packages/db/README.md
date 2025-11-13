# @gmgncard/db

Drizzle ORM schema、D1 migrations 与种子脚本的集中存放地。

## 目录

- `src/schema.ts`：Drizzle schema 定义与 helper。
- `migrations/`：`wrangler d1 migrations apply` 使用的 SQL。
- `seed/`：初始数据（按钮、主题、页面）。

## TODO

- 定义 `user_profiles`、二维码字段、验证流程相关索引。
- 添加 `pnpm` 脚本封装 Drizzle CLI。***

## 命令

```bash
pnpm --filter @gmgncard/db migrations:generate   # 基于 schema 生成 SQL
```

## Seed

开发阶段可通过 wrangler 将示例数据导入本地 D1：

```bash
wrangler d1 execute gmgncard-db --local --file packages/db/migrations/0001_init.sql
wrangler d1 execute gmgncard-db --local --file packages/db/seed/dev_seed.sql
```
