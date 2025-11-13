# Verification Playbook

用途：指导管理员在 GMGN Card 上完成用户资料审核、二维码校验处理。

## 1. 登录后台

1. 访问 Admin 地址（本地为 `http://localhost:4173/`）。
2. 使用已有账号 `登录`，若无账号可先 `注册`（会自动获发 JWT）。生产环境请通过 Cloudflare Access 控制入口。
3. 登录后刷新页面，确认 `Users/Links/Reports` 模块加载成功。

## 2. 审核用户资料

1. 在 `Users` 面板选择一个 handle。
2. 核对用户上传的二维码链接、尺码、备注等信息。
3. 通过 `PUT /api/users/:handle/profile` API（目前可使用 Postman 或后续 UI）将 `verificationStatus` 调整为 `approved/rejected`，同时填写 notes。
4. 若包含敏感二维码，请确认 R2 访问策略及展示逻辑（仅在验证通过时面向公众展示）。

## 3. 链接管理

1. 在 `Links` 面板输入目标 handle。
2. 新增链接：填写标题、URL、排序以及是否隐藏，提交后会调用 `POST /api/users/:handle/links`。
3. 删除或隐藏违规链接：点击 `删除` 或勾选 `隐藏`，Worker 会在 `/@:handle` 页面自动同步。

## 4. 处理

1. 在 `Reports` 面板查看所有 `open` 状态。
2. 与用户沟通或交叉验证后，将下拉菜单调整为 `reviewing/resolved/rejected`，会触发 `PATCH /api/reports/:id`。
3. 对恶意用户可结合 Links CRUD 直接下架链接或设置为隐藏。

## 5. 冒烟验证

每次审核批量操作后，建议运行：
```bash
pnpm smoke
```
确保 `/api/health`、`/api/users` 以及公开页面正常响应。***
