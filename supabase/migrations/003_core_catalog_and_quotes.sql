-- Core catalog and quote model for the product information system.
-- This migration keeps legacy text fields while adding structured relations.

create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  aliases text[] not null default '{}',
  description text,
  website_url text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  type text not null default 'supplier' check (type in ('supplier', 'manufacturer', 'brand_owner', 'distributor', 'other')),
  contact_name text,
  contact_phone text,
  contact_email text,
  website_url text,
  address text,
  description text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products
  add column if not exists category_id uuid references public.categories(id) on delete set null,
  add column if not exists brand_id uuid references public.brands(id) on delete set null,
  add column if not exists description text;

create table if not exists public.product_companies (
  product_id uuid not null references public.products(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  relationship_type text not null default 'supplier' check (relationship_type in ('supplier', 'manufacturer', 'brand_owner', 'distributor', 'other')),
  notes text,
  created_at timestamptz not null default now(),
  primary key (product_id, company_id, relationship_type)
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  quote_no text unique,
  product_id uuid not null references public.products(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  currency text not null default 'CNY' check (currency ~ '^[A-Z]{3}$'),
  unit_price numeric(18, 4),
  min_order_quantity integer,
  valid_from date,
  valid_until date,
  status text not null default 'active' check (status in ('draft', 'active', 'expired', 'archived')),
  remarks text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quotes_valid_date_range check (
    valid_from is null
    or valid_until is null
    or valid_until >= valid_from
  ),
  constraint quotes_min_order_quantity_positive check (
    min_order_quantity is null
    or min_order_quantity > 0
  ),
  constraint quotes_unit_price_non_negative check (
    unit_price is null
    or unit_price >= 0
  )
);

alter table public.documents
  add column if not exists product_id uuid references public.products(id) on delete set null,
  add column if not exists company_id uuid references public.companies(id) on delete set null;

create table if not exists public.quote_documents (
  quote_id uuid not null references public.quotes(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (quote_id, document_id)
);

create index if not exists idx_categories_parent_id on public.categories(parent_id);
create index if not exists idx_categories_status_sort on public.categories(status, sort_order, name);
create index if not exists idx_brands_status_name on public.brands(status, name);
create index if not exists idx_companies_type_status_name on public.companies(type, status, name);
create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_products_brand_id on public.products(brand_id);
create index if not exists idx_product_companies_company_id on public.product_companies(company_id);
create index if not exists idx_documents_product_id on public.documents(product_id);
create index if not exists idx_documents_company_id on public.documents(company_id);
create index if not exists idx_quotes_product_id on public.quotes(product_id);
create index if not exists idx_quotes_company_id on public.quotes(company_id);
create index if not exists idx_quotes_status_valid_until on public.quotes(status, valid_until);
create index if not exists idx_quotes_created_at on public.quotes(created_at desc);
create index if not exists idx_quote_documents_document_id on public.quote_documents(document_id);

insert into public.categories (name, slug)
select distinct
  products.category,
  'legacy-' || substr(md5(products.category), 1, 12)
from public.products
where products.category is not null
  and not exists (
    select 1
    from public.categories
    where categories.name = products.category
  );

update public.products
set category_id = categories.id
from public.categories
where products.category_id is null
  and products.category = categories.name;

update public.documents
set product_id = products.id
from public.products
where documents.product_id is null
  and documents.product_model = products.model;

drop trigger if exists trg_categories_set_updated_at on public.categories;
create trigger trg_categories_set_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

drop trigger if exists trg_brands_set_updated_at on public.brands;
create trigger trg_brands_set_updated_at
before update on public.brands
for each row
execute function public.set_updated_at();

drop trigger if exists trg_companies_set_updated_at on public.companies;
create trigger trg_companies_set_updated_at
before update on public.companies
for each row
execute function public.set_updated_at();

drop trigger if exists trg_quotes_set_updated_at on public.quotes;
create trigger trg_quotes_set_updated_at
before update on public.quotes
for each row
execute function public.set_updated_at();

alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.companies enable row level security;
alter table public.product_companies enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_documents enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'categories'
      and policyname = 'categories_select_authenticated'
  ) then
    create policy "categories_select_authenticated"
    on public.categories for select
    using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'categories'
      and policyname = 'categories_write_admin'
  ) then
    create policy "categories_write_admin"
    on public.categories for all
    using (public.is_admin())
    with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'brands'
      and policyname = 'brands_select_authenticated'
  ) then
    create policy "brands_select_authenticated"
    on public.brands for select
    using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'brands'
      and policyname = 'brands_write_admin'
  ) then
    create policy "brands_write_admin"
    on public.brands for all
    using (public.is_admin())
    with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'companies'
      and policyname = 'companies_select_authenticated'
  ) then
    create policy "companies_select_authenticated"
    on public.companies for select
    using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'companies'
      and policyname = 'companies_write_admin'
  ) then
    create policy "companies_write_admin"
    on public.companies for all
    using (public.is_admin())
    with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'product_companies'
      and policyname = 'product_companies_select_authenticated'
  ) then
    create policy "product_companies_select_authenticated"
    on public.product_companies for select
    using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'product_companies'
      and policyname = 'product_companies_write_admin'
  ) then
    create policy "product_companies_write_admin"
    on public.product_companies for all
    using (public.is_admin())
    with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'quotes'
      and policyname = 'quotes_select_authenticated'
  ) then
    create policy "quotes_select_authenticated"
    on public.quotes for select
    using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'quotes'
      and policyname = 'quotes_write_admin'
  ) then
    create policy "quotes_write_admin"
    on public.quotes for all
    using (public.is_admin())
    with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'quote_documents'
      and policyname = 'quote_documents_select_authenticated'
  ) then
    create policy "quote_documents_select_authenticated"
    on public.quote_documents for select
    using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'quote_documents'
      and policyname = 'quote_documents_write_admin'
  ) then
    create policy "quote_documents_write_admin"
    on public.quote_documents for all
    using (public.is_admin())
    with check (public.is_admin());
  end if;
end;
$$;

create or replace function public.create_quote_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  product_model_value text;
  product_name_value text;
  company_name_value text;
begin
  select model, name
  into product_model_value, product_name_value
  from public.products
  where id = new.product_id;

  select name
  into company_name_value
  from public.companies
  where id = new.company_id;

  insert into public.updates (
    type,
    title,
    content,
    product_model,
    old_value,
    new_value,
    created_by
  )
  values (
    'price_update',
    coalesce(product_model_value, product_name_value, '未关联产品') || ' 报价更新',
    coalesce(company_name_value, '未关联公司') || ' 更新报价',
    product_model_value,
    null,
    case
      when new.unit_price is null then null
      else new.currency || ' ' || new.unit_price::text
    end,
    new.created_by
  );

  return new;
end;
$$;

drop trigger if exists trg_quotes_create_update on public.quotes;
create trigger trg_quotes_create_update
after insert on public.quotes
for each row
execute function public.create_quote_update();
