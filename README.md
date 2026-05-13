# 商品资料与报价协同平台

服务于跨境电商 B2B 业务的商品信息平台，用来统一管理商品分类、规格资料、图片、报价单、供应商信息和动态更新。项目目标不是做电商下单、ERP 或普通网盘，而是做一个带前台展示和后台管理的商品资料中枢。

当前前台参考 [m.panelook.cn](https://m.panelook.cn/) 的目录型展示方式，强调分类导航、参数检索、资料汇总和信息密度；后台负责商品、报价、文档、公司、动态和权限管理。

## 当前定位

- 前台：面向公司内部或授权账号的展示前台，提供搜索、分类浏览、商品详情、资料查看、报价查看和动态浏览。
- 后台：面向运营、销售、产品和管理层的管理后台，负责录入、整理、审核和维护业务数据。
- 后端：优先接入 Supabase Cloud，统一承载 Auth、PostgreSQL、Storage 和 RLS。

## MVP 核心能力

- 商品信息库：分类、品牌、型号、名称、基础参数、标签、启停状态。
- 资料中心：规格书、图片、PDF、认证资料、技术文档上传与归档。
- 报价中心：按公司和商品管理报价单、报价版本和生效时间。
- 公司库：沉淀供应商/品牌方/报价来源公司信息。
- 动态中心：新品、报价更新、内部通知和资料更新记录。
- 搜索与筛选：优先支持型号、分类、品牌、标签、公司和文档标题检索。

## 当前判断

本项目已经不应再按“单一后台资料系统”推进。现阶段需要先完成产品定位、信息架构和数据模型重整，再继续云端联调和功能开发。当前仓库中的部分文档、页面和 migration 更适合作为原型参考，而不是最终业务方案。

## 文档入口

- [docs/README.md](./docs/README.md)：项目核心文档入口。
- [docs/PRD.md](./docs/PRD.md)：项目背景、目标用户、业务边界、MVP 范围和当前阶段。
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)：前后台架构、页面结构、数据模型和实施顺序。
- [docs/CLOUDFLARE_PAGES_DEPLOY.md](./docs/CLOUDFLARE_PAGES_DEPLOY.md)：Cloudflare Pages 双项目部署配置与发布约定。
- [docs/ROUTES.md](./docs/ROUTES.md)：前后台路由规划和页面体系。
- [docs/TASKS.md](./docs/TASKS.md)：开发任务清单、迭代顺序、当前状态和验收标准。
- [design/frontend-ui/UI_SPEC.md](./design/frontend-ui/UI_SPEC.md)：前台设计规范、设计令牌、移动端适配规则和页面验收标准。
- [supabase/README.md](./supabase/README.md)：Supabase 初始化、迁移、权限和存储细节。
- [AGENTS.md](./AGENTS.md)：Codex 和其他 coding agent 的项目级开发约束。

## 开发环境

```bash
pnpm install
pnpm dev
```

常用验证命令：

```bash
pnpm -F @vben/web-ele run typecheck
pnpm run build
pnpm run check:supabase
```

## 当前开发重点

当前已进入首批 MVP 联调、验收和收口阶段。前台核心页面、后台核心维护页、Supabase 数据模型与 migration 已具备基础闭环，后续重点不再是新增大模块，而是把真实数据链路、权限回归和设计稿还原逐项打磨稳定。

1. 前台继续按 `design/frontend-ui/UI_SPEC.md` 做桌面和移动端验收。
2. 打通后台维护到前台展示的细节链路：关联公司、报价附件、商品图片和资料入口。
3. 保持前台默认只展示 `active` 业务数据，避免停用数据、草稿报价、归档报价进入用户浏览链路。
4. 做 Supabase RLS 权限回归：匿名不可读写、普通用户只读、管理员可写。
5. 每完成一个页面或链路，更新 `docs/TASKS.md` 并用可见浏览器截图验收。
