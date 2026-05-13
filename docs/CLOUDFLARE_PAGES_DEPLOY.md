# Cloudflare Pages 部署

本仓库已切换为 Cloudflare Pages 双项目部署，分别承载前台与后台两个静态站点：

- `apps/web-front` -> 前台站点
- `apps/web-ele` -> 后台管理站点

业务后端仍然是 Supabase Cloud。Cloudflare Pages 只负责静态站点构建、发布、域名和边缘分发，不承载业务数据库与鉴权逻辑。

## 部署目标

- 使用 Cloudflare Pages 的 Git 集成。
- 同一个 Git 仓库连接两个独立的 Pages 项目。
- 仅 `master` 分支触发生产部署。
- 关闭非 `master` 分支的自动预览部署。

## Pages 项目配置

### 前台项目

- Project name: 自定义，例如 `product-info-front`
- Production branch: `master`
- Root directory: `apps/web-front`
- Build command: `pnpm -C ../.. run build:front`
- Build output directory: `dist`

### 后台项目

- Project name: 自定义，例如 `product-info-admin`
- Production branch: `master`
- Root directory: `apps/web-ele`
- Build command: `pnpm -C ../.. run build:ele`
- Build output directory: `dist`

## 环境变量

在两个 Pages 项目的 Dashboard 中分别配置：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

如果前台与后台域名、回调地址或其他公开配置不同，再分别补充各自所需的 `VITE_*` 变量。

不要在仓库、文档示例、GitHub Secrets 截图或构建日志中写入真实密钥。

## 分支与发布策略

- Production branch 固定为 `master`
- Production deployments: `Enabled`
- Preview deployments: `None`

这样只有推送到 `master` 才会触发生产发布，其他分支既不会发布到生产，也不会自动生成预览环境。

## Monorepo 构建触发控制

Cloudflare Pages 在 monorepo 下默认会让同仓库关联的所有 Pages 项目都参与构建。为了避免前后台互相误触发，需要在每个项目的 `Settings > Builds & deployments > Build watch paths` 中分别配置。

### 前台项目 watch paths

- Include paths:
  - `apps/web-front/*`
  - `packages/*`
  - `internal/*`
  - `package.json`
  - `pnpm-lock.yaml`
  - `pnpm-workspace.yaml`
  - `turbo.json`
  - `scripts/local/remove-sass-embedded-links.mjs`
- Exclude paths:
  - 留空

### 后台项目 watch paths

- Include paths:
  - `apps/web-ele/*`
  - `packages/*`
  - `internal/*`
  - `package.json`
  - `pnpm-lock.yaml`
  - `pnpm-workspace.yaml`
  - `turbo.json`
  - `scripts/local/remove-sass-embedded-links.mjs`
- Exclude paths:
  - 留空

如果后续新增共享构建脚本、公共配置目录或静态资源目录，需要同步补充到两个项目的 include paths。

## 自定义域名

- 前台域名绑定到前台 Pages 项目
- 后台域名绑定到后台 Pages 项目

切换域名时同时检查：

- HTTPS 已签发
- Cloudflare DNS 记录已指向对应 Pages 项目
- Supabase Auth 回调域名已同步更新
- 前后台跨域或白名单配置未遗漏

## SPA 路由刷新

前台和后台都使用浏览器路由。为了避免用户直接刷新子路径时出现 404，仓库已在两个站点的静态资源目录中提供 Cloudflare Pages 兼容的 `_redirects`：

```text
/*    /index.html   200
```

如后续改为 hash 路由，可重新评估是否还需要该规则，但当前建议保留。

## 本地验证

优先执行：

```bash
pnpm -F @vben/web-ele run typecheck
pnpm run build
pnpm run build:front
pnpm run build:ele
```

验证重点：

- 两个项目均能成功产出 `dist`
- 产物中包含 `_redirects`
- 部署后前后台首页可访问
- 刷新任意前后台子路由不返回 404
- Supabase 读请求与登录流程正常

## 迁移说明

仓库内旧的其他平台部署 workflow、文档和配套脚本均已移除，不再作为发布入口。
