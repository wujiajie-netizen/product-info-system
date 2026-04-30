create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  model text not null unique,
  name text not null,
  spec_json jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  product_model text references public.products(model) on update cascade on delete set null,
  file_type text not null check (file_type in ('quote', 'spec', 'image', 'technical', 'other')),
  category text not null,
  file_url text not null,
  storage_path text,
  tags text[] not null default '{}',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.updates (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('price_update', 'product', 'notice')),
  title text not null,
  content text,
  product_model text references public.products(model) on update cascade on delete set null,
  old_value text,
  new_value text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_model on public.products(model);
create index if not exists idx_documents_product_model on public.documents(product_model);
create index if not exists idx_documents_file_type on public.documents(file_type);
create index if not exists idx_updates_product_model on public.updates(product_model);
create index if not exists idx_updates_created_at on public.updates(created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.documents enable row level security;
alter table public.updates enable row level security;

create policy "profiles_select_self_or_admin"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

create policy "profiles_update_admin"
on public.profiles for all
using (public.is_admin())
with check (public.is_admin());

create policy "products_select_authenticated"
on public.products for select
using (auth.role() = 'authenticated');

create policy "products_write_admin"
on public.products for all
using (public.is_admin())
with check (public.is_admin());

create policy "documents_select_authenticated"
on public.documents for select
using (auth.role() = 'authenticated');

create policy "documents_write_admin"
on public.documents for all
using (public.is_admin())
with check (public.is_admin());

create policy "updates_select_authenticated"
on public.updates for select
using (auth.role() = 'authenticated');

create policy "updates_write_admin"
on public.updates for all
using (public.is_admin())
with check (public.is_admin());

create or replace function public.create_document_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.file_type = 'quote' then
    insert into public.updates (
      type,
      title,
      content,
      product_model,
      created_by
    )
    values (
      'price_update',
      coalesce(new.product_model, '未关联产品') || ' 报价资料更新',
      new.title,
      new.product_model,
      new.created_by
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_documents_create_update on public.documents;
create trigger trg_documents_create_update
after insert on public.documents
for each row
execute function public.create_document_update();
