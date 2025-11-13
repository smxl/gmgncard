# Verification Playbook

用途：指导管理员在 GMGN Card 上完成用户资料审核、二维码校验处理。

## 1. 登录后台

1. 访问 Admin 地址（本地为 `http://localhost:4173/`）。
2. 使用已有账号 `登录`，若无账号可先 `注册`（会自动获发 JWT）。生产环境请通过 Cloudflare Access 控制入口。
3. 登录后刷新页面，确认 `Users/Links/Reports` 模块加载成功。

## 2. 审核用户资料

1. 在 `Pending Profiles` 面板选择一个 handle。
2. 核对用户提交的尺寸（pSize/fSize/height/weight）、Position（Top/Bottom/Vers/Side）、二维码等信息。
3. 若通过，勾选是否解锁二维码（QR Access），点击“通过”；若拒绝，在备注中填写原因并点击“拒绝”。两者都会调用 `PUT /api/users/:handle/profile`。
4. 通过后资料立即对外展示；拒绝后用户可在自助面板看到状态并重新提交。

## 3. 链接管理

1. 在 `Links` 面板输入目标 handle，管理员可批量管理；普通用户在 `My Links` 自助面板维护自己链接。
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
确保 `/api/health`、`/api/users`、`/api/plaza` 以及公开页面正常响应。***
