-- Optional local/demo seed data. Run after migrations.
-- Real users are created through Supabase Auth; promote one user by updating public.profiles.role.

insert into public.products (category, model, name, spec_json, tags, status)
values
  (
    '传感器',
    'SEN-1000',
    '温湿度传感器 SEN-1000',
    '{"range": "-20~80C", "accuracy": "±0.5C", "interface": "RS485"}'::jsonb,
    array['温湿度', 'RS485', '工业'],
    'active'
  ),
  (
    '控制器',
    'CTRL-200',
    '边缘控制器 CTRL-200',
    '{"cpu": "ARM Cortex-A53", "memory": "2GB", "network": "Ethernet/Wi-Fi"}'::jsonb,
    array['边缘计算', '控制器'],
    'active'
  )
on conflict (model) do update
set category = excluded.category,
    name = excluded.name,
    spec_json = excluded.spec_json,
    tags = excluded.tags,
    status = excluded.status,
    updated_at = now();

insert into public.documents (
  title,
  product_model,
  file_type,
  category,
  file_url,
  storage_path,
  tags
)
values
  (
    'SEN-1000 产品规格书',
    'SEN-1000',
    'spec',
    '产品资料',
    'storage://product-documents/specs/SEN-1000-spec.pdf',
    'specs/SEN-1000-spec.pdf',
    array['规格书', '传感器']
  ),
  (
    'CTRL-200 报价单',
    'CTRL-200',
    'quote',
    '报价资料',
    'storage://product-documents/quotes/CTRL-200-quote.xlsx',
    'quotes/CTRL-200-quote.xlsx',
    array['报价', '控制器']
  );

insert into public.updates (type, title, content, product_model)
values
  (
    'notice',
    '演示数据已初始化',
    '已写入产品、文档和动态示例。文档文件需要单独上传到 product-documents bucket。',
    null
  );
