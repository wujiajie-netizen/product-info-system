drop policy if exists "products_select_authenticated" on public.products;
create policy "products_select_public"
on public.products for select
using (status = 'active');

drop policy if exists "documents_select_authenticated" on public.documents;
create policy "documents_select_public"
on public.documents for select
using (true);

drop policy if exists "updates_select_authenticated" on public.updates;
create policy "updates_select_public"
on public.updates for select
using (true);

drop policy if exists "categories_select_authenticated" on public.categories;
create policy "categories_select_public"
on public.categories for select
using (status = 'active');

drop policy if exists "brands_select_authenticated" on public.brands;
create policy "brands_select_public"
on public.brands for select
using (status = 'active');

drop policy if exists "companies_select_authenticated" on public.companies;
create policy "companies_select_public"
on public.companies for select
using (status = 'active');

drop policy if exists "product_companies_select_authenticated" on public.product_companies;
create policy "product_companies_select_public"
on public.product_companies for select
using (
  exists (
    select 1
    from public.companies companies
    where companies.id = product_companies.company_id
      and companies.status = 'active'
  )
  and (
    exists (
      select 1
      from public.products products
      where products.id = product_companies.product_id
        and products.status = 'active'
    )
    or exists (
      select 1
      from public.product_variants variants
      where variants.id = product_companies.product_id
        and variants.status = 'active'
    )
  )
);

drop policy if exists "quotes_select_authenticated" on public.quotes;
create policy "quotes_select_public"
on public.quotes for select
using (status = 'active');

drop policy if exists "quote_documents_select_authenticated" on public.quote_documents;
create policy "quote_documents_select_public"
on public.quote_documents for select
using (true);

drop policy if exists "product_series_select_authenticated" on public.product_series;
create policy "product_series_select_public"
on public.product_series for select
using (status = 'active');

drop policy if exists "product_variants_select_authenticated" on public.product_variants;
create policy "product_variants_select_public"
on public.product_variants for select
using (status = 'active');

drop policy if exists "product_spec_items_select_authenticated" on public.product_spec_items;
create policy "product_spec_items_select_public"
on public.product_spec_items for select
using (
  exists (
    select 1
    from public.product_variants variants
    where variants.id = product_spec_items.variant_id
      and variants.status = 'active'
  )
);

drop policy if exists "quote_batches_select_authenticated" on public.quote_batches;
create policy "quote_batches_select_public"
on public.quote_batches for select
using (status = 'active');

drop policy if exists "quote_lines_select_authenticated" on public.quote_lines;
create policy "quote_lines_select_public"
on public.quote_lines for select
using (
  status = 'active'
  and exists (
    select 1
    from public.quote_batches batches
    where batches.id = quote_lines.quote_batch_id
      and batches.status = 'active'
  )
);

drop policy if exists "quote_price_tiers_select_authenticated" on public.quote_price_tiers;
create policy "quote_price_tiers_select_public"
on public.quote_price_tiers for select
using (
  exists (
    select 1
    from public.quote_lines lines
    join public.quote_batches batches
      on batches.id = lines.quote_batch_id
    where lines.id = quote_price_tiers.quote_line_id
      and lines.status = 'active'
      and batches.status = 'active'
  )
);

drop policy if exists "quote_options_select_authenticated" on public.quote_options;
create policy "quote_options_select_public"
on public.quote_options for select
using (
  (
    quote_batch_id is not null
    and exists (
      select 1
      from public.quote_batches batches
      where batches.id = quote_options.quote_batch_id
        and batches.status = 'active'
    )
  )
  or (
    quote_line_id is not null
    and exists (
      select 1
      from public.quote_lines lines
      join public.quote_batches batches
        on batches.id = lines.quote_batch_id
      where lines.id = quote_options.quote_line_id
        and lines.status = 'active'
        and batches.status = 'active'
    )
  )
);

drop policy if exists "product_documents_select_authenticated" on storage.objects;
create policy "product_documents_select_public"
on storage.objects for select
using (bucket_id = 'product-documents');
