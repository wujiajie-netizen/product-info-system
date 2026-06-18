# Codex 开发约束

## 项目后端策略

当前开发阶段优先接入 Supabase Cloud，前端通过 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 连接云端项目。不要在代码、文档示例或提交记录中写入 `service_role` key、真实 anon key、数据库密码或其他密钥。

本文件是 Codex 和 coding agent 的项目级指令文档，应保持简洁、可执行、不过度记录业务背景。业务背景写入 `docs/PRD.md`，技术路线写入 `docs/ARCHITECTURE.md`，Supabase 操作细节写入 `supabase/README.md`，文档总入口写入 `docs/README.md`。

## 未来本地迁移要求

本项目后续可能从 Supabase Cloud 迁移到本地或私有服务器。所有开发工作都必须保持可迁移：

- 数据库结构、索引、RLS policy、Storage policy、触发器和函数必须通过 `supabase/migrations` 管理。
- 不允许只在 Supabase Dashboard 手工改表后不落 migration。
- 前端页面不得直接散落调用 Supabase Client，业务访问统一封装在 `apps/web-ele/src/api/product-info`。
- 文件资料必须结构化落表，`documents.storage_path` 保存 bucket 内对象路径，`file_url` 不得依赖只在云端有效的短期签名 URL。
- Storage bucket 名称保持为 `product-documents`，除非同时更新 migration、API 层和技术文档。
- MVP 阶段避免依赖 Supabase Cloud 独有能力；如果必须使用，先在技术文档中记录本地替代方案。
- 上线前需要做一次 Cloud 到本地或自托管环境的迁移演练，范围包括业务表、Auth 用户、Storage 对象和前端环境变量。

## Vue 页面组件拆分

开发或重构 Vue `views` 页面时，必须遵守 `docs/FRONTEND_COMPONENT_SPLIT_GUIDE.md`。

核心要求：

- 不为了拆分而拆分，不把 `index.vue` 拆成没有业务可读性的组件清单。
- `index.vue` 可以保留页面标题、简单搜索框、简单 tabs、轻量筛选、页面级状态和页面级事件协调。
- 优先拆分复杂列表 item、详情弹窗、编辑弹窗、抽屉、表格、上传区、复杂业务卡片等独立性高的功能块。
- 当前模块私有组件必须放在 `views/[module]/components/`，不要擅自放到全局 `src/components/`。
- 组件可以包含只服务自己的逻辑、状态和接口；但列表 item 不得因自身渲染触发详情接口请求，避免 N+1 请求。
- 除非用户明确要求，不要顺手抽 `composables/`、`types.ts`、`constants.ts`、`utils.ts`。

## 开发验证

涉及 Supabase 的改动完成后，至少确认：

- `supabase/migrations` 能从空库按顺序执行。
- 匿名用户不可读写业务表。
- 登录用户可读取产品、文档和动态。
- `profiles.role = 'admin'` 的用户可写产品、文档、动态和用户角色。
- 普通 `user` 角色不能执行写操作。

前端改动完成后优先运行：

```bash
pnpm -F @vben/web-ele run typecheck
pnpm run build
```

## 文档维护

- 根目录只保留一个面向项目的 `README.md`。
- 不恢复 Vben 模板原始多语言 README，除非项目重新需要多语言文档。
- 子包 README 可保留作为 Vben 内部模块说明，不作为业务需求来源。

## UI 设计参考

- 前台 UI 设计稿统一存放在 `design/frontend-ui/`。
- 涉及前台页面开发时，优先读取该目录中的设计图并按图实现，不以默认模板样式自行发挥。
- `design/frontend-ui/README.md` 负责说明每张设计图对应的页面和用途。
