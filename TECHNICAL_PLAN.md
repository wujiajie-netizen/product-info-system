# 技术计划

## 后端策略

开发阶段采用 Supabase Cloud 优先，不在本机强制启动 Supabase Docker 环境。这样可以先把真实登录、数据库读写、Storage 上传下载、RLS 权限和业务页面联调跑通，减少本地容器、端口和系统环境带来的阻塞。

本项目仍然按可迁移架构开发：业务表结构、RLS、触发器、Storage bucket 和策略全部保存在 `supabase/migrations` 中；前端只通过 `apps/web-ele/src/lib/supabase.ts` 创建 Supabase Client，并由 `apps/web-ele/src/api/product-info` 统一封装业务访问。

## 云端接入

1. 在 Supabase Cloud 创建项目。
2. 在 SQL Editor 中按顺序执行：
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_backend_requirements.sql`
3. 可选执行 `supabase/seed.sql` 写入演示产品、文档记录和动态记录。
4. 在 Supabase Auth 中创建测试用户。
5. 使用 SQL Editor 将首个管理员提升为 `admin`：

```sql
update public.profiles
set role = 'admin'
where email = 'admin@example.com';
```

6. 在前端本地环境文件中配置云端项目：

```ini
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

不要把 `service_role` key 写入前端、文档示例或 Git 仓库。

配置完成后执行：

```bash
pnpm run check:supabase
```

该命令用于确认 Supabase Cloud URL 可访问，且 anon key 被 REST API 接受。

## 本地迁移原则

未来如果需要从 Supabase Cloud 迁移到本地或私有服务器，迁移范围分为四类：

- 数据库 schema：继续使用 `supabase/migrations` 重放。
- 业务数据：通过 PostgreSQL dump/restore 或 Supabase 官方迁移流程导出导入。
- Auth 用户：需要单独验证 `auth` schema、邮件配置、回调地址和版本兼容性。
- Storage 文件：需要单独迁移真实对象文件，数据库中的 `documents.storage_path` 只保存对象路径，不能替代文件迁移。

为降低迁移成本，开发阶段必须遵守：

- 新增表、字段、索引、策略和触发器必须写入 migration。
- 页面不得直接散落调用 Supabase Client，统一走 `apps/web-ele/src/api/product-info`。
- 数据表中保存 `storage_path` 和结构化元数据，不保存只适用于 Supabase Cloud 的临时签名 URL。
- 不依赖 Supabase Cloud 独有功能作为 MVP 核心链路。
- 上线前至少做一次从 Cloud 到自托管或本地环境的演练恢复。

## 任务拆分

1. 云端接入验证（下一步）
   - 完成 Supabase Cloud 项目初始化。
   - 执行两份 migration 和可选 seed。
   - 配置 `apps/web-ele/.env.local`。
   - 验证登录、用户 profile、RLS 读写边界和 Storage bucket。

2. 产品管理 CRUD（已完成基础版本）
   - 已支持产品新增、编辑、启用/停用和搜索。
   - API 层已提供 `createProduct`、`updateProduct`、`setProductStatus`。
   - 后续需要接真实云端账号验证 admin 可写、user 只读。

3. 文档与动态闭环
   - 完善文档编辑、删除和上传失败回滚。
   - 验证报价类文档上传后自动生成动态。
   - 补齐动态编辑或删除策略。

4. 交付验证
   - 运行 `pnpm -F @vben/web-ele run typecheck`。
   - 运行 `pnpm run build`。
   - 整理部署说明、账号初始化说明和云端到本地迁移演练记录。

## 文档职责

- `README.md`：项目入口和快速开始。
- `PROJECT_SUMMARY.md`：产品定位、MVP 范围和当前阶段。
- `supabase/README.md`：后端初始化、权限、Storage 和迁移细节。
- `AGENTS.md`：Codex 和 coding agent 自动读取的开发约束。
