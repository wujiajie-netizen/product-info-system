# Supabase 后端说明

本项目后端采用 Supabase，覆盖数据库、登录认证、文件存储、权限控制和实时更新。

## 初始化顺序

1. 在 Supabase 创建项目。
2. 打开 SQL Editor，执行 `migrations/001_initial_schema.sql`。
3. 创建 Storage bucket：`product-documents`。
4. 在 `apps/web-ele/.env.local` 中配置：

```ini
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## MVP 权限

- `admin`：产品管理、文件上传、动态发布、用户维护。
- `user`：只读查询、查看动态、下载文件。

数据库使用 RLS 控制真实读写权限，前端使用 Vben Admin 控制菜单、路由和按钮显示。

## 正式后端接入约定

后续正式开发以 Supabase 为真实后端，不再新增独立 Node、Java 或 PHP 接口服务。普通业务读写由前端通过 `@supabase/supabase-js` 调用 Supabase；真正的数据安全由数据库 RLS 和 Storage Policy 兜底，前端权限只负责菜单、按钮和交互显示。

### 后端边界

- 数据库：Supabase PostgreSQL。
- 登录认证：Supabase Auth，前端替换 Vben mock 登录。
- 数据权限：PostgreSQL RLS，所有暴露给浏览器访问的 public 表都必须启用 RLS。
- 文件存储：Supabase Storage，bucket 暂定为 `product-documents`。
- 复杂服务端逻辑：优先使用数据库函数、触发器或 Supabase Edge Functions；禁止把 service role key 放到前端。

### 本地与远程流程

推荐使用 Supabase CLI 管理本地开发和远程迁移：

```bash
supabase start
supabase db reset
supabase migration up
supabase db push
```

远程项目准备好之后，将前端环境变量写入：

```ini
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 接入顺序

1. 完善数据库迁移：`profiles`、`products`、`documents`、`updates`、索引、触发器、RLS、Storage Policy。
2. 接入 Supabase Auth：登录、登出、刷新会话、用户资料、角色读取。
3. 建立前端数据服务层：统一放在 `apps/web-ele/src/api/product-info`，页面不直接散落写 Supabase 查询。
4. 产品资料接真实表：产品列表、筛选、创建、编辑、停用。
5. 文档资料接 Storage 和 `documents` 表：上传、关联产品、标签、下载、预览。
6. 动态记录接 `updates` 表：手动发布动态，报价文档上传后自动生成更新记录。
7. 用户权限接 `profiles` 表：管理员维护角色，普通用户只读。
