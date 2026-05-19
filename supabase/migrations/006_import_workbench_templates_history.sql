create extension if not exists pgcrypto;

create table if not exists public.import_templates (
  id uuid primary key default gen_random_uuid(),
  template_name text not null,
  supplier_company_id uuid references public.companies(id) on delete set null,
  supplier_name text,
  quote_sheet_name text,
  quote_sheet_matcher text,
  header_row integer not null default 1 check (header_row > 0),
  model_column text,
  size_column text,
  summary_config_column text,
  remark_column text,
  tier_mappings jsonb not null default '[]'::jsonb,
  detail_sheet_rule text,
  detail_mappings jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'inactive')),
  is_default boolean not null default false,
  last_used_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.import_histories (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  template_id uuid references public.import_templates(id) on delete set null,
  imported_by uuid references auth.users(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'success', 'partial_success', 'failed')),
  total_rows integer not null default 0,
  new_product_count integer not null default 0,
  update_product_count integer not null default 0,
  quote_only_count integer not null default 0,
  new_quote_count integer not null default 0,
  failed_row_count integer not null default 0,
  skipped_row_count integer not null default 0,
  source_document_id uuid references public.documents(id) on delete set null,
  warning_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.import_history_rows (
  id uuid primary key default gen_random_uuid(),
  import_history_id uuid not null references public.import_histories(id) on delete cascade,
  row_index integer,
  model_code text,
  action text not null default 'create' check (action in ('create', 'update', 'quote_only', 'skip', 'failed')),
  status text not null default 'success' check (status in ('success', 'failed', 'skipped', 'warning')),
  variant_id uuid references public.product_variants(id) on delete set null,
  quote_line_id uuid references public.quote_lines(id) on delete set null,
  error_message text,
  warning_message text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_import_templates_supplier_status
  on public.import_templates(supplier_company_id, status, updated_at desc);
create index if not exists idx_import_templates_default
  on public.import_templates(is_default) where is_default = true;
create index if not exists idx_import_histories_template_created
  on public.import_histories(template_id, created_at desc);
create index if not exists idx_import_history_rows_history_status
  on public.import_history_rows(import_history_id, status);

create unique index if not exists idx_import_templates_single_default
  on public.import_templates(is_default)
  where is_default = true;

drop trigger if exists trg_import_templates_set_updated_at on public.import_templates;
create trigger trg_import_templates_set_updated_at
before update on public.import_templates
for each row
execute function public.set_updated_at();

drop trigger if exists trg_import_histories_set_updated_at on public.import_histories;
create trigger trg_import_histories_set_updated_at
before update on public.import_histories
for each row
execute function public.set_updated_at();

alter table public.import_templates enable row level security;
alter table public.import_histories enable row level security;
alter table public.import_history_rows enable row level security;

drop policy if exists "import_templates_select_authenticated" on public.import_templates;
create policy "import_templates_select_authenticated"
on public.import_templates for select
using (auth.role() = 'authenticated');

drop policy if exists "import_templates_write_admin" on public.import_templates;
create policy "import_templates_write_admin"
on public.import_templates for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "import_histories_select_authenticated" on public.import_histories;
create policy "import_histories_select_authenticated"
on public.import_histories for select
using (auth.role() = 'authenticated');

drop policy if exists "import_histories_write_admin" on public.import_histories;
create policy "import_histories_write_admin"
on public.import_histories for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "import_history_rows_select_authenticated" on public.import_history_rows;
create policy "import_history_rows_select_authenticated"
on public.import_history_rows for select
using (auth.role() = 'authenticated');

drop policy if exists "import_history_rows_write_admin" on public.import_history_rows;
create policy "import_history_rows_write_admin"
on public.import_history_rows for all
using (public.is_admin())
with check (public.is_admin());
