create extension if not exists pgcrypto;

create table if not exists public.product_series (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  brand_id uuid references public.brands(id) on delete set null,
  series_code text not null,
  series_name text not null,
  product_type text,
  base_description text,
  default_material text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_series_series_code_unique unique (series_code)
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.product_series(id) on delete cascade,
  model_code text not null,
  display_name text not null,
  size_inch numeric(10, 2),
  chipset text,
  ram_gb numeric(10, 2),
  storage_gb numeric(10, 2),
  os_name text,
  os_version text,
  camera_mp numeric(10, 2),
  brightness_nits numeric(10, 2),
  resolution_width integer,
  resolution_height integer,
  touch_type text,
  touch_interface text,
  wifi_spec text,
  bluetooth_version text,
  ethernet_spec text,
  poe_supported boolean,
  poe_standard text,
  material text,
  vesa_spec text,
  speaker_spec text,
  summary_config_text text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_model_code_unique unique (model_code)
);

create table if not exists public.product_spec_items (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  section_key text not null,
  section_label text not null,
  spec_key text not null,
  spec_label text not null,
  spec_value_text text,
  spec_value_number numeric(18, 4),
  unit text,
  value_json jsonb,
  is_filterable boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quote_batches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  source_document_id uuid references public.documents(id) on delete set null,
  batch_title text not null,
  published_at date,
  effective_from date,
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'draft' check (status in ('draft', 'active', 'expired', 'archived')),
  entry_mode text not null default 'manual',
  global_note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quote_lines (
  id uuid primary key default gen_random_uuid(),
  quote_batch_id uuid not null references public.quote_batches(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  standard_config_text text,
  row_note text,
  firmware_note text,
  sort_order integer not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quote_lines_batch_variant_unique unique (quote_batch_id, variant_id)
);

create table if not exists public.quote_price_tiers (
  id uuid primary key default gen_random_uuid(),
  quote_line_id uuid not null references public.quote_lines(id) on delete cascade,
  min_quantity integer not null check (min_quantity > 0),
  max_quantity integer,
  unit_price numeric(18, 4) not null check (unit_price >= 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quote_options (
  id uuid primary key default gen_random_uuid(),
  scope_type text not null check (scope_type in ('batch', 'line')),
  quote_batch_id uuid references public.quote_batches(id) on delete cascade,
  quote_line_id uuid references public.quote_lines(id) on delete cascade,
  option_type text not null check (option_type in ('accessory', 'firmware', 'material_change', 'other')),
  option_name text not null,
  delta_type text not null check (delta_type in ('increase', 'decrease', 'text_only')),
  price_delta numeric(18, 4),
  currency text check (currency ~ '^[A-Z]{3}$'),
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quote_options_scope_check check (
    (scope_type = 'batch' and quote_batch_id is not null)
    or (scope_type = 'line' and quote_line_id is not null)
  )
);

alter table public.documents
  add column if not exists series_id uuid references public.product_series(id) on delete set null,
  add column if not exists variant_id uuid references public.product_variants(id) on delete set null,
  add column if not exists quote_batch_id uuid references public.quote_batches(id) on delete set null,
  add column if not exists document_kind text,
  add column if not exists source_sheet_name text,
  add column if not exists sort_order integer not null default 0,
  add column if not exists is_primary boolean not null default false;

alter table public.updates
  add column if not exists series_id uuid references public.product_series(id) on delete set null,
  add column if not exists variant_id uuid references public.product_variants(id) on delete set null,
  add column if not exists quote_batch_id uuid references public.quote_batches(id) on delete set null;

create index if not exists idx_product_series_company_category_status
  on public.product_series(company_id, category_id, status);
create index if not exists idx_product_variants_series_status
  on public.product_variants(series_id, status);
create index if not exists idx_product_spec_items_variant_section_sort
  on public.product_spec_items(variant_id, section_key, sort_order);
create index if not exists idx_documents_series_variant_kind
  on public.documents(series_id, variant_id, document_kind);
create index if not exists idx_documents_quote_batch_id
  on public.documents(quote_batch_id);
create index if not exists idx_quote_batches_company_status_published
  on public.quote_batches(company_id, status, published_at desc);
create index if not exists idx_quote_lines_batch_variant
  on public.quote_lines(quote_batch_id, variant_id);
create index if not exists idx_quote_price_tiers_line_min_quantity
  on public.quote_price_tiers(quote_line_id, min_quantity);
create index if not exists idx_quote_options_batch_line_scope
  on public.quote_options(quote_batch_id, quote_line_id, scope_type, option_type);
create index if not exists idx_updates_series_variant
  on public.updates(series_id, variant_id, created_at desc);

drop trigger if exists trg_product_series_set_updated_at on public.product_series;
create trigger trg_product_series_set_updated_at
before update on public.product_series
for each row
execute function public.set_updated_at();

drop trigger if exists trg_product_variants_set_updated_at on public.product_variants;
create trigger trg_product_variants_set_updated_at
before update on public.product_variants
for each row
execute function public.set_updated_at();

drop trigger if exists trg_product_spec_items_set_updated_at on public.product_spec_items;
create trigger trg_product_spec_items_set_updated_at
before update on public.product_spec_items
for each row
execute function public.set_updated_at();

drop trigger if exists trg_quote_batches_set_updated_at on public.quote_batches;
create trigger trg_quote_batches_set_updated_at
before update on public.quote_batches
for each row
execute function public.set_updated_at();

drop trigger if exists trg_quote_lines_set_updated_at on public.quote_lines;
create trigger trg_quote_lines_set_updated_at
before update on public.quote_lines
for each row
execute function public.set_updated_at();

drop trigger if exists trg_quote_price_tiers_set_updated_at on public.quote_price_tiers;
create trigger trg_quote_price_tiers_set_updated_at
before update on public.quote_price_tiers
for each row
execute function public.set_updated_at();

drop trigger if exists trg_quote_options_set_updated_at on public.quote_options;
create trigger trg_quote_options_set_updated_at
before update on public.quote_options
for each row
execute function public.set_updated_at();

alter table public.product_series enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_spec_items enable row level security;
alter table public.quote_batches enable row level security;
alter table public.quote_lines enable row level security;
alter table public.quote_price_tiers enable row level security;
alter table public.quote_options enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'product_series'
      and policyname = 'product_series_select_authenticated'
  ) then
    create policy "product_series_select_authenticated"
    on public.product_series for select
    using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'product_series'
      and policyname = 'product_series_write_admin'
  ) then
    create policy "product_series_write_admin"
    on public.product_series for all
    using (public.is_admin())
    with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'product_variants'
      and policyname = 'product_variants_select_authenticated'
  ) then
    create policy "product_variants_select_authenticated"
    on public.product_variants for select
    using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'product_variants'
      and policyname = 'product_variants_write_admin'
  ) then
    create policy "product_variants_write_admin"
    on public.product_variants for all
    using (public.is_admin())
    with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'product_spec_items'
      and policyname = 'product_spec_items_select_authenticated'
  ) then
    create policy "product_spec_items_select_authenticated"
    on public.product_spec_items for select
    using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'product_spec_items'
      and policyname = 'product_spec_items_write_admin'
  ) then
    create policy "product_spec_items_write_admin"
    on public.product_spec_items for all
    using (public.is_admin())
    with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'quote_batches'
      and policyname = 'quote_batches_select_authenticated'
  ) then
    create policy "quote_batches_select_authenticated"
    on public.quote_batches for select
    using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'quote_batches'
      and policyname = 'quote_batches_write_admin'
  ) then
    create policy "quote_batches_write_admin"
    on public.quote_batches for all
    using (public.is_admin())
    with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'quote_lines'
      and policyname = 'quote_lines_select_authenticated'
  ) then
    create policy "quote_lines_select_authenticated"
    on public.quote_lines for select
    using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'quote_lines'
      and policyname = 'quote_lines_write_admin'
  ) then
    create policy "quote_lines_write_admin"
    on public.quote_lines for all
    using (public.is_admin())
    with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'quote_price_tiers'
      and policyname = 'quote_price_tiers_select_authenticated'
  ) then
    create policy "quote_price_tiers_select_authenticated"
    on public.quote_price_tiers for select
    using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'quote_price_tiers'
      and policyname = 'quote_price_tiers_write_admin'
  ) then
    create policy "quote_price_tiers_write_admin"
    on public.quote_price_tiers for all
    using (public.is_admin())
    with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'quote_options'
      and policyname = 'quote_options_select_authenticated'
  ) then
    create policy "quote_options_select_authenticated"
    on public.quote_options for select
    using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'quote_options'
      and policyname = 'quote_options_write_admin'
  ) then
    create policy "quote_options_write_admin"
    on public.quote_options for all
    using (public.is_admin())
    with check (public.is_admin());
  end if;
end;
$$;

insert into public.product_series (
  category_id,
  brand_id,
  series_code,
  series_name,
  product_type,
  base_description,
  status,
  created_at,
  updated_at
)
select
  products.category_id,
  products.brand_id,
  products.model,
  products.name,
  products.category,
  products.description,
  products.status,
  products.created_at,
  products.updated_at
from public.products
where not exists (
  select 1
  from public.product_series
  where product_series.series_code = products.model
);

insert into public.product_variants (
  series_id,
  model_code,
  display_name,
  chipset,
  ram_gb,
  storage_gb,
  os_name,
  brightness_nits,
  summary_config_text,
  status,
  created_at,
  updated_at
)
select
  series.id,
  products.model,
  products.name,
  products.spec_json ->> 'cpu',
  nullif(regexp_replace(coalesce(products.spec_json ->> 'ram', products.spec_json ->> 'memory', ''), '[^0-9.]', '', 'g'), '')::numeric,
  nullif(regexp_replace(coalesce(products.spec_json ->> 'storage', ''), '[^0-9.]', '', 'g'), '')::numeric,
  coalesce(products.spec_json ->> 'os', products.spec_json ->> 'system'),
  nullif(regexp_replace(coalesce(products.spec_json ->> 'brightness', ''), '[^0-9.]', '', 'g'), '')::numeric,
  coalesce(products.spec_json ->> 'summary', products.description),
  products.status,
  products.created_at,
  products.updated_at
from public.products
join public.product_series as series
  on series.series_code = products.model
where not exists (
  select 1
  from public.product_variants
  where product_variants.model_code = products.model
);

insert into public.product_spec_items (
  variant_id,
  section_key,
  section_label,
  spec_key,
  spec_label,
  spec_value_text,
  value_json,
  sort_order,
  created_at,
  updated_at
)
select
  variants.id,
  'general',
  'General',
  spec.key,
  spec.key,
  spec.value,
  to_jsonb(spec.value),
  spec.ordinality - 1,
  products.created_at,
  products.updated_at
from public.products
join public.product_variants as variants
  on variants.model_code = products.model
cross join lateral jsonb_each_text(products.spec_json) with ordinality as spec(key, value, ordinality)
where not exists (
  select 1
  from public.product_spec_items
  where product_spec_items.variant_id = variants.id
);

update public.documents
set series_id = series.id,
    variant_id = variants.id,
    document_kind = coalesce(
      documents.document_kind,
      case documents.file_type
        when 'quote' then 'quote_workbook'
        when 'spec' then 'spec_sheet'
        when 'image' then 'product_image'
        when 'technical' then 'technical'
        else 'other'
      end
    )
from public.product_variants as variants
join public.product_series as series
  on series.id = variants.series_id
where (documents.product_model = variants.model_code or documents.product_id = (select products.id from public.products where products.model = variants.model_code limit 1))
  and (documents.variant_id is null or documents.series_id is null or documents.document_kind is null);

insert into public.quote_batches (
  company_id,
  source_document_id,
  batch_title,
  published_at,
  effective_from,
  currency,
  status,
  entry_mode,
  global_note,
  created_by,
  created_at,
  updated_at
)
select
  quotes.company_id,
  quote_document.document_id,
  coalesce(quotes.quote_no, variants.model_code || ' quote'),
  quotes.valid_from,
  quotes.valid_from,
  quotes.currency,
  quotes.status,
  'legacy_quote',
  quotes.remarks,
  quotes.created_by,
  quotes.created_at,
  quotes.updated_at
from public.quotes
join public.product_variants as variants
  on variants.id = (
    select pv.id
    from public.product_variants as pv
    join public.products on products.model = pv.model_code
    where products.id = quotes.product_id
    limit 1
  )
left join lateral (
  select quote_documents.document_id
  from public.quote_documents
  where quote_documents.quote_id = quotes.id
  limit 1
) as quote_document on true
where not exists (
  select 1
  from public.quote_batches
  where quote_batches.entry_mode = 'legacy_quote'
    and quote_batches.batch_title = coalesce(quotes.quote_no, variants.model_code || ' quote')
    and quote_batches.company_id = quotes.company_id
);

insert into public.quote_lines (
  quote_batch_id,
  variant_id,
  standard_config_text,
  row_note,
  sort_order,
  status,
  created_at,
  updated_at
)
select
  batches.id,
  variants.id,
  coalesce(products.spec_json ->> 'summary', products.description),
  quotes.remarks,
  0,
  case when quotes.status = 'archived' then 'inactive' else 'active' end,
  quotes.created_at,
  quotes.updated_at
from public.quotes
join public.products
  on products.id = quotes.product_id
join public.product_variants as variants
  on variants.model_code = products.model
join public.quote_batches as batches
  on batches.company_id = quotes.company_id
 and batches.batch_title = coalesce(quotes.quote_no, variants.model_code || ' quote')
 and batches.entry_mode = 'legacy_quote'
where not exists (
  select 1
  from public.quote_lines
  where quote_lines.quote_batch_id = batches.id
    and quote_lines.variant_id = variants.id
);

insert into public.quote_price_tiers (
  quote_line_id,
  min_quantity,
  unit_price,
  currency,
  sort_order,
  created_at,
  updated_at
)
select
  lines.id,
  coalesce(quotes.min_order_quantity, 1),
  quotes.unit_price,
  quotes.currency,
  0,
  quotes.created_at,
  quotes.updated_at
from public.quotes
join public.products
  on products.id = quotes.product_id
join public.product_variants as variants
  on variants.model_code = products.model
join public.quote_batches as batches
  on batches.company_id = quotes.company_id
 and batches.batch_title = coalesce(quotes.quote_no, variants.model_code || ' quote')
 and batches.entry_mode = 'legacy_quote'
join public.quote_lines as lines
  on lines.quote_batch_id = batches.id
 and lines.variant_id = variants.id
where quotes.unit_price is not null
  and not exists (
    select 1
    from public.quote_price_tiers
    where quote_price_tiers.quote_line_id = lines.id
  );

update public.documents
set quote_batch_id = batches.id
from public.quote_batches as batches
where documents.quote_batch_id is null
  and documents.id = batches.source_document_id;

create or replace function public.create_quote_batch_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  company_name_value text;
begin
  if new.status = 'active' then
    select name
    into company_name_value
    from public.companies
    where id = new.company_id;

    insert into public.updates (
      type,
      title,
      content,
      series_id,
      quote_batch_id,
      new_value,
      created_by
    )
    values (
      'price_update',
      new.batch_title || ' 报价更新',
      coalesce(company_name_value, '未关联公司') || ' 发布了新的报价批次',
      null,
      new.id,
      new.currency,
      new.created_by
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_quote_batches_create_update on public.quote_batches;
create trigger trg_quote_batches_create_update
after insert on public.quote_batches
for each row
execute function public.create_quote_batch_update();
