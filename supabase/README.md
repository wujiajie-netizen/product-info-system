# Supabase 后端

本目录维护产品资料系统的 Supabase 数据库、认证、文件存储、RLS 权限和演示数据草案。当前约定：真实业务后端优先使用 Supabase，不新增独立 Node、Java 或 PHP API 服务。

## 云端优先

当前开发阶段优先使用 Supabase Cloud，不强制依赖本地 Docker。原因是 MVP 需要先跑通真实登录、RLS、Storage 和业务页面联调；本地或自托管部署作为上线前演练和后续迁移方向保留。

云端初始化顺序：

1. 在 Supabase Cloud 创建项目。
2. 在 SQL Editor 中执行 `migrations/001_initial_schema.sql`。
3. 继续执行 `migrations/002_backend_requirements.sql`。
4. 继续执行 `migrations/003_core_catalog_and_quotes.sql`。
5. 继续执行 `migrations/004_series_variant_quote_batches.sql`。
6. 可选执行 `seed.sql` 写入演示产品、文档记录和动态记录。
7. 在 Supabase Auth 中创建测试用户。
8. 将首个管理员提升为 `admin`。
9. 在前端环境变量中配置 Supabase URL 和公开 key。Supabase 新版界面可能显示为 `PUBLISHABLE_KEY`，可写入本项目的 `VITE_SUPABASE_ANON_KEY`。

```ini
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-publishable-or-anon-key
```

管理员提升 SQL：

```sql
update public.profiles
set role = 'admin'
where email = 'admin@example.com';
```

只允许在前端使用 publishable/anon key，不得把 service role key 写入 `apps/web-front`、`apps/web-ele`、文档示例或 Git 仓库。

配置完成后可以在仓库根目录执行云端连通性检查：

```bash
pnpm run check:supabase
```

该检查会同时校验 `apps/web-front/.env.local` 和 `apps/web-ele/.env.local` 是否存在、值是否一致，并拦截把 `service_role` key 误放到前端环境变量中的情况。脚本只验证 Cloud URL 和浏览器公开 key 的连通性，不再把“匿名可读业务表”当作通过条件，也不会打印完整 anon key。

如果你还想顺手做一次真实账号冒烟登录，可以临时追加以下环境变量再执行：

```bash
$env:SUPABASE_CHECK_EMAIL="user@gmail.com"
$env:SUPABASE_CHECK_PASSWORD="你的测试密码"
$env:SUPABASE_CHECK_EXPECT_ROLE="user"
pnpm run check:supabase
```

## 演示环境初始化

如果需要初始化完整演示环境，按下面顺序执行：

```bash
pnpm demo:seed
pnpm demo:assets
pnpm demo:upload
```

说明：

- `pnpm demo:seed`：根据 `demo-data/catalog.json` 重新生成 `supabase/seed.sql`
- `pnpm demo:assets`：在 `demo-data/assets/` 生成 32 份本地演示图片、规格书、技术资料和报价附件
- `pnpm demo:upload`：把本地演示资料上传到 `product-documents` bucket

执行 `pnpm demo:upload` 前，需要在终端提供以下环境变量名：

```ini
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=product-documents
```

随后在 Supabase SQL Editor 或受控脚本中执行 `supabase/seed.sql`，再在 Auth 中创建：

- `admin@example.com`
- `user@example.com`

收尾验收时，建议直接打开 [cloud-final-acceptance.sql](/D:/project/dome/product-info-system/supabase/cloud-final-acceptance.sql) 复用账号角色、总量统计和 6 个重点型号抽查 SQL。

## Migration 内容

- `profiles`、`categories`、`brands`、`companies`、`products`、`documents`、`quotes`、`updates`：核心业务表和索引。
- `product_companies`、`quote_documents`：商品公司关系和报价附件关系。
- `public.handle_new_user()`：Supabase Auth 新用户创建后自动写入 `public.profiles`。
- `public.set_updated_at()`：统一维护 `profiles`、`products`、`documents` 的 `updated_at`。
- `public.create_document_update()`：报价类文档创建后自动写入一条 `updates` 动态。
- `public.create_quote_update()`：报价主体创建后自动写入一条 `updates` 动态。
- `product-documents` Storage bucket：私有 bucket，限制常见文档和图片 MIME 类型，单文件上限 50 MB。
- Storage policies：登录用户可读取文件对象，管理员可新增、更新和删除文件对象。

## 权限模型

- `admin`：产品管理、文件上传、动态发布、用户角色维护。
- `user`：只读查询、查看动态、下载资料。

真实安全边界由 PostgreSQL RLS 和 Storage Policy 兜底。前端权限只负责菜单、按钮和交互显示，不能代替数据库权限。

## 账号初始化

`profiles` 会在用户注册或被邀请后自动创建，默认角色为 `user`。首个管理员需要在 Supabase SQL Editor 中由项目维护者手动提升：

```sql
update public.profiles
set role = 'admin'
where email = 'admin@example.com';
```

如果使用 service role 或 SQL Editor 写入数据，请确认不要把 service role key 放到前端代码或浏览器环境变量中。

## Storage 约定

Bucket 名称固定为 `product-documents`。推荐对象路径按类型分组：

```text
specs/SEN-1000-spec.pdf
quotes/CTRL-200-quote.xlsx
images/SEN-1000-front.png
technical/CTRL-200-wiring.pdf
```

`documents.storage_path` 保存 bucket 内路径，`documents.file_url` 可先保存 `storage://product-documents/<path>` 形式。前端下载时使用 Supabase Storage API 根据 `storage_path` 创建签名 URL。

## 本地与远程

本地开发或迁移演练推荐使用 Supabase CLI 管理迁移：

```bash
supabase start
supabase db reset
supabase migration up
supabase db push
```

本地重置时如需演示数据，可在迁移后执行：

```bash
supabase db reset
```

Supabase CLI 本地重置会在迁移后读取 `supabase/seed.sql`。远程环境如需演示数据，请在确认不会污染生产数据后，通过 SQL Editor 或受控脚本执行 `seed.sql`。

## 本地化迁移

如果后续需要从 Supabase Cloud 迁移到本地或私有服务器，不能只迁移业务表。完整迁移范围包括：

- PostgreSQL schema 和业务数据。
- `auth` schema 中的用户、身份和登录配置。
- `storage` schema 中的 bucket 元数据。
- `product-documents` bucket 中的真实文件对象。
- 前端环境变量、认证回调地址、邮件配置和域名。

为了降低迁移成本，开发阶段必须坚持：

- 所有数据库变更都写入 `supabase/migrations`。
- 业务代码只保存 `storage_path` 和结构化元数据，不保存临时签名 URL。
- 不把 Supabase Cloud 独有功能放进 MVP 核心链路。
- 上线前做一次 Cloud 到本地或自托管环境的恢复演练。

## 接入边界

- 数据库：Supabase PostgreSQL。
- 登录认证：Supabase Auth。
- 数据权限：所有暴露给浏览器访问的 public 表必须启用 RLS。
- 文件存储：Supabase Storage，业务 bucket 为 `product-documents`。
- 复杂服务端逻辑：优先使用数据库函数、触发器或 Supabase Edge Functions。
