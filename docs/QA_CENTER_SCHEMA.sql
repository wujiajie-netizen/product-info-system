-- 问答中心数据库表结构建议
-- 适用：Supabase / PostgreSQL
-- 说明：前台页面已按 docs/QA_CENTER_API.md 的字段契约开发；执行本 SQL 后，apps/web-front/src/api/qa-center.ts 和 apps/web-ele 后台问答管理可直接读写真实表。

create extension if not exists pgcrypto;

create table if not exists public.qa_questions (
  id uuid primary key default gen_random_uuid(),
  question_no text not null unique,
  title text not null,
  question text not null,
  answer text,
  category text not null check (category in ('product', 'technical', 'spec', 'quote', 'after_sales')),
  status text not null default 'pending' check (status in ('pending', 'answered', 'archived')),
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  product_id uuid,
  product_model text,
  product_name text,
  source text not null default 'manual' check (source in ('manual', 'product_generated', 'imported')),
  tags text[] not null default '{}',
  view_count integer not null default 0,
  helpful_count integer not null default 0,
  asked_by uuid,
  asker_role text,
  answered_by uuid,
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.qa_question_specs (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.qa_questions(id) on delete cascade,
  spec_key text not null,
  spec_label text not null,
  spec_value text not null,
  sort_order integer not null default 0
);

create table if not exists public.qa_question_documents (
  question_id uuid not null references public.qa_questions(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  relation_type text not null default 'other' check (relation_type in ('spec', 'technical', 'quote', 'image', 'other')),
  primary key (question_id, document_id)
);

create index if not exists idx_qa_questions_status on public.qa_questions(status);
create index if not exists idx_qa_questions_category on public.qa_questions(category);
create index if not exists idx_qa_questions_product_id on public.qa_questions(product_id);
create index if not exists idx_qa_questions_product_model on public.qa_questions(product_model);
create index if not exists idx_qa_questions_updated_at on public.qa_questions(updated_at desc);
create index if not exists idx_qa_questions_hot on public.qa_questions(helpful_count desc, view_count desc, updated_at desc);
create index if not exists idx_qa_question_specs_question_id on public.qa_question_specs(question_id);
create index if not exists idx_qa_question_documents_question_id on public.qa_question_documents(question_id);
create index if not exists idx_qa_question_documents_document_id on public.qa_question_documents(document_id);

create or replace function public.set_qa_questions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_qa_questions_updated_at on public.qa_questions;
create trigger trg_qa_questions_updated_at
before update on public.qa_questions
for each row
execute function public.set_qa_questions_updated_at();

-- RLS：前台公开读 answered/pending，后台 admin 可全量维护。
alter table public.qa_questions enable row level security;
alter table public.qa_question_specs enable row level security;
alter table public.qa_question_documents enable row level security;

drop policy if exists "qa_questions_public_read" on public.qa_questions;
create policy "qa_questions_public_read"
  on public.qa_questions
  for select
  using (status in ('answered', 'pending'));

drop policy if exists "qa_questions_public_insert_pending" on public.qa_questions;
create policy "qa_questions_public_insert_pending"
  on public.qa_questions
  for insert
  with check (status = 'pending' and source = 'manual');

drop policy if exists "qa_questions_write_admin" on public.qa_questions;
create policy "qa_questions_write_admin"
  on public.qa_questions
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "qa_question_specs_public_read" on public.qa_question_specs;
create policy "qa_question_specs_public_read"
  on public.qa_question_specs
  for select
  using (
    exists (
      select 1
      from public.qa_questions q
      where q.id = qa_question_specs.question_id
        and q.status in ('answered', 'pending')
    )
  );

drop policy if exists "qa_question_specs_write_admin" on public.qa_question_specs;
create policy "qa_question_specs_write_admin"
  on public.qa_question_specs
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "qa_question_documents_public_read" on public.qa_question_documents;
create policy "qa_question_documents_public_read"
  on public.qa_question_documents
  for select
  using (
    exists (
      select 1
      from public.qa_questions q
      where q.id = qa_question_documents.question_id
        and q.status in ('answered', 'pending')
    )
  );

drop policy if exists "qa_question_documents_write_admin" on public.qa_question_documents;
create policy "qa_question_documents_write_admin"
  on public.qa_question_documents
  for all
  using (public.is_admin())
  with check (public.is_admin());
