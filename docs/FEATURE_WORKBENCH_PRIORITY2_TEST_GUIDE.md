# feature-workbench Priority 2 测试与验证指南

> 目的：提供可让 Codex 或开发者执行 Priority 2 功能测试和本地验证的完整步骤。

## 1. 拉取最新代码
```bash
git fetch origin
git checkout feature-workbench
git pull origin feature-workbench
git branch --show-current
```

## 2. 安装依赖
```bash
pnpm install
```
如需清理重装：
```bash
rm -rf node_modules apps/web-ele/node_modules apps/web-front/node_modules
pnpm install
```

## 3. 构建与检查
```bash
pnpm lint
pnpm typecheck
pnpm build
```
如无 typecheck：
```bash
pnpm lint
pnpm build
```

## 4. 执行 Supabase 迁移
迁移文件：`supabase/migrations/006_import_workbench_templates_history.sql`

方式一：CLI
```bash
supabase db push
```
方式二：SQL Editor 手动执行

## 5. 数据库检查
确认存在表：
- import_templates
- import_histories
- import_history_rows

RLS 是否开启：relrowsecurity = true

## 6. 准备真实 Excel 样本
至少包含：报价总表、多型号 Sheet、阶梯价列、备注/选配列、产品图片、已存在型号、新型号

## 7. 启动项目
```bash
pnpm dev
pnpm --filter web-ele dev
```

## 8. 功能验证清单
- Excel 工作台 /admin/product-info/workbench
- 重复型号策略
- 导入模板 /admin/product-info/import-templates
- 导入历史 /admin/product-info/import-history
- 手动建档 /admin/product-info/manual-entry
- 多文件资料补齐 /admin/product-info/document-fill
- 报价选配项 /admin/product-info/quote-options
- 后台看板快捷入口 /admin/dashboard

## 9. 数据库验证 SQL
- 检查商品、报价、选配项、资料文件、导入模板、导入历史

## 10. Codex 提交问题模板
提供错误信息、复现页面、操作步骤、期望/实际结果

## 11. 验收标准
- pnpm build 成功
- Supabase 迁移成功
- 后台路由可访问
- Excel 工作台、手动建档、资料补齐、报价选配项、导入模板、导入历史页面正常
- 数据库记录正确

## 12. 风险点
- TypeScript 编译错误
- 组件导入遗漏
- RLS 权限问题
- 唯一约束影响新建策略
- quote_options 约束
- 文件上传 bucket
- 工作台导入历史未串联
- Excel 嵌入图片解析
- Excel 表头差异