-- Supabase Cloud final acceptance checklist
-- Run these statements in Supabase SQL Editor after seeding demo data.

-- 1) Confirm admin/user roles.
select email, role
from public.profiles
where email in ('admin@gmail.com', 'user@gmail.com');

-- If needed, run these fixes manually.
-- update public.profiles
-- set role = 'admin'
-- where email = 'admin@gmail.com';
--
-- update public.profiles
-- set role = 'user'
-- where email = 'user@gmail.com';

-- 2) Verify demo data totals.
select
  (select count(*) from public.categories) as categories,
  (select count(*) from public.brands) as brands,
  (select count(*) from public.companies) as companies,
  (select count(*) from public.product_series) as product_series,
  (select count(*) from public.product_variants) as product_variants,
  (select count(*) from public.documents) as documents,
  (select count(*) from public.quote_lines) as quote_lines,
  (select count(*) from public.updates) as updates;

-- 3) Spot-check the six key models for documents, quote lines, companies, and updates.
select
  variants.model_code,
  count(distinct docs.id) as documents,
  count(distinct lines.id) as quote_lines,
  count(distinct companies.company_id) as companies,
  count(distinct ups.id) as updates
from public.product_variants as variants
left join public.products
  on products.model = variants.model_code
left join public.documents as docs
  on docs.variant_id = variants.id
left join public.quote_lines as lines
  on lines.variant_id = variants.id
left join (
  select pc.product_id, pc.company_id
  from public.product_companies as pc
  union
  select products.id as product_id, batches.company_id
  from public.quote_batches as batches
  join public.product_variants as pv
    on pv.id = batches.variant_id
  join public.products
    on products.model = pv.model_code
) as companies
  on companies.product_id = products.id
left join public.updates as ups
  on ups.variant_id = variants.id
where variants.model_code in (
  'HDM-215B',
  'TAB-R10-4G',
  'DT312-128',
  'AX20-P',
  'BAT-X6-6800',
  'CTRL-200B'
)
group by variants.model_code
order by variants.model_code;
