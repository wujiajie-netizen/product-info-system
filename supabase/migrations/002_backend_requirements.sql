-- Backend requirements for the product information system.
-- This migration is intentionally idempotent so it can be re-run while drafting.

create extension if not exists pgcrypto;

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

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_products_set_updated_at on public.products;
create trigger trg_products_set_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

drop trigger if exists trg_documents_set_updated_at on public.documents;
create trigger trg_documents_set_updated_at
before update on public.documents
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', ''), ''),
    case
      when new.raw_user_meta_data ->> 'role' in ('admin', 'user') then new.raw_user_meta_data ->> 'role'
      else 'user'
    end
  )
  on conflict (id) do update
    set email = excluded.email,
        name = coalesce(public.profiles.name, excluded.name),
        role = case
          when public.profiles.role in ('admin', 'user') then public.profiles.role
          else excluded.role
        end,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-documents',
  'product-documents',
  false,
  52428800,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'image/png',
    'image/jpeg',
    'image/webp',
    'text/plain'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'product_documents_select_authenticated'
  ) then
    create policy "product_documents_select_authenticated"
    on storage.objects for select
    using (
      bucket_id = 'product-documents'
      and auth.role() = 'authenticated'
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'product_documents_insert_admin'
  ) then
    create policy "product_documents_insert_admin"
    on storage.objects for insert
    with check (
      bucket_id = 'product-documents'
      and public.is_admin()
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'product_documents_update_admin'
  ) then
    create policy "product_documents_update_admin"
    on storage.objects for update
    using (
      bucket_id = 'product-documents'
      and public.is_admin()
    )
    with check (
      bucket_id = 'product-documents'
      and public.is_admin()
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'product_documents_delete_admin'
  ) then
    create policy "product_documents_delete_admin"
    on storage.objects for delete
    using (
      bucket_id = 'product-documents'
      and public.is_admin()
    );
  end if;
end;
$$;
