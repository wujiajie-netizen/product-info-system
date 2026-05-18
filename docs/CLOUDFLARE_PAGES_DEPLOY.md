# Cloudflare Pages 部署

本项目采用 Cloudflare Pages 的 Git 集成方式部署两个静态站点：

- `apps/web-front` -> 前台站点
- `apps/web-ele` -> 后台管理站点

业务后端仍然是 Supabase Cloud。Cloudflare Pages 只负责静态资源构建、发布、域名和边缘分发，不承载业务数据库与鉴权逻辑。

## 部署目标

- 代码托管在 GitHub。
- Cloudflare Pages 直接连接 GitHub 仓库。
- 推送到 `master` 时自动触发构建和生产发布。
- 非 `master` 分支不自动发布预览环境。

## 首次接入 GitHub

当前本地仓库已经初始化 Git，但远程仍可能指向其他平台。首次迁移到 GitHub 时按下面步骤操作。

### 1. 在 GitHub 创建空仓库

- 仓库名建议与当前项目保持一致，例如 `product-info-system`
- 不要勾选 `README`、`.gitignore`、`License`
- 默认分支使用 `master`

### 2. 本地切换远程

如果当前 `origin` 仍指向 Gitee，建议先保留一份旧远程，再把 GitHub 设为新的 `origin`：

```bash
git remote rename origin gitee
git remote add origin https://github.com/<your-org-or-user>/product-info-system.git
git remote -v
```

如果你不需要保留旧远程，也可以直接改 URL：

```bash
git remote set-url origin https://github.com/<your-org-or-user>/product-info-system.git
git remote -v
```

### 3. 首次推送到 GitHub

```bash
git push -u origin master
```

首次推送成功后：

- GitHub Actions 会执行仓库内的 `master` 构建校验 workflow
- Cloudflare Pages 在绑定该仓库后，会监听 `master` 并自动部署

## GitHub Actions 校验

仓库已新增 `master` 分支构建校验工作流：

- 文件：`.github/workflows/master-build.yml`
- 触发条件：
  - push 到 `master`
  - 提交 PR 到 `master`

校验内容：

- `pnpm -F @vben/web-ele run typecheck`
- `pnpm run build:front`
- `pnpm run build:ele`

说明：

- 这个 workflow 只负责在 GitHub 上做构建校验
- 真正的线上发布仍由 Cloudflare Pages 的 Git 集成完成

## Pages 项目配置

### 前台项目

- Project name: 例如 `product-info-front`
- Production branch: `master`
- Root directory: `apps/web-front`
- Build command: `pnpm -C ../.. run build:front`
- Build output directory: `dist`
- Preview deployments: `None`

### 后台项目

- Project name: 例如 `product-info-admin`
- Production branch: `master`
- Root directory: `apps/web-ele`
- Build command: `pnpm -C ../.. run build:ele`
- Build output directory: `dist`
- Preview deployments: `None`

## 环境变量

分别在两个 Pages 项目的 `Settings > Environment variables` 中配置：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

注意：

- 不要在仓库、文档示例、GitHub Secrets 截图或构建日志里写入真实密钥
- 不要写入 `service_role` key
- 如果前后台有不同公开配置，再分别增加对应的 `VITE_*` 变量

## Monorepo 构建触发控制

Cloudflare Pages 在 monorepo 下默认可能让同仓库的多个 Pages 项目都参与构建。为避免前后台互相误触发，需要分别配置 `Build watch paths`。

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

如果后续新增共享构建脚本、公共配置目录或静态资源目录，需要同步补到两个项目的 include paths。

## 自定义域名

- 前台域名绑定到前台 Pages 项目
- 后台域名绑定到后台 Pages 项目

切换域名时同时检查：

- HTTPS 已签发
- Cloudflare DNS 记录已指向对应 Pages 项目
- Supabase Auth 回调域名已同步更新
- 前后台跨域或白名单配置没有遗漏

## SPA 路由刷新

前台和后台都使用浏览器路由。为避免刷新子路径时出现 404，两个站点的静态资源目录中都应保留 `_redirects`：

```text
/*    /index.html   200
```

如果后续改成 hash 路由，可重新评估是否还需要该规则，但当前建议保留。

## 本地验证

前端改动完成后优先执行：

```bash
pnpm -F @vben/web-ele run typecheck
pnpm run build
pnpm run build:front
pnpm run build:ele
```

验证重点：

- 两个项目都能成功产出 `dist`
- 产物中包含 `_redirects`
- 部署后前后台首页可访问
- 刷新任意前后台子路由不会返回 404
- Supabase 读取与登录流程正常

## 后续操作流程

日常建议按下面的节奏执行：

1. 在功能分支开发并本地验证
2. 提交 PR 合并到 `master`
3. GitHub Actions 自动跑构建校验
4. `master` 更新后 Cloudflare Pages 自动构建前后台两个站点
5. 到 Cloudflare Pages Dashboard 检查两次部署是否成功

如果当前阶段不走 PR，也可以直接推送 `master`，效果是一样的：GitHub Actions 校验会运行，Cloudflare Pages 会自动发布。
