import type {
  CompanyRecord,
  CompanyStatus,
  CompanyType,
  ListParams,
  ProductCompanyRecord,
  ProductCompanyRelationship,
} from './types';

import {
  assertSupabaseClient,
  normalizeKeyword,
  normalizeSlug,
  toLikePattern,
} from './client';

export interface CompanyListParams extends ListParams {
  status?: CompanyStatus;
  type?: CompanyType;
}

export interface SaveCompanyInput {
  address?: string;
  contactEmail?: string;
  contactName?: string;
  contactPhone?: string;
  description?: string;
  name: string;
  slug?: string;
  status?: CompanyStatus;
  type?: CompanyType;
  websiteUrl?: string;
}

export interface SaveProductCompanyInput {
  companyId: string;
  notes?: string;
  productId: string;
  relationshipType?: ProductCompanyRelationship;
}

export async function listCompanies(params: CompanyListParams = {}) {
  const supabase = assertSupabaseClient();
  const keyword = normalizeKeyword(params.keyword);
  let query = supabase.from('companies').select('*').order('name');

  if (params.status) {
    query = query.eq('status', params.status);
  }

  if (params.type) {
    query = query.eq('type', params.type);
  }

  if (keyword) {
    const pattern = toLikePattern(keyword);
    query = query.or(`name.ilike.${pattern},slug.ilike.${pattern}`);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []) as CompanyRecord[];
}

export async function createCompany(input: SaveCompanyInput) {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('companies')
    .insert(toCompanyPayload(input))
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as CompanyRecord;
}

export async function updateCompany(id: string, input: SaveCompanyInput) {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('companies')
    .update(toCompanyPayload(input))
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as CompanyRecord;
}

export async function setCompanyStatus(id: string, status: CompanyStatus) {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('companies')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as CompanyRecord;
}

export async function listProductCompanies(productId: string) {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('product_companies')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []) as ProductCompanyRecord[];
}

export async function upsertProductCompany(input: SaveProductCompanyInput) {
  const supabase = assertSupabaseClient();
  const { data, error } = await supabase
    .from('product_companies')
    .upsert({
      company_id: input.companyId,
      notes: input.notes || null,
      product_id: input.productId,
      relationship_type: input.relationshipType || 'supplier',
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as ProductCompanyRecord;
}

export async function deleteProductCompany(
  productId: string,
  companyId: string,
  relationshipType: ProductCompanyRelationship = 'supplier',
) {
  const supabase = assertSupabaseClient();
  const { error } = await supabase
    .from('product_companies')
    .delete()
    .eq('product_id', productId)
    .eq('company_id', companyId)
    .eq('relationship_type', relationshipType);

  if (error) {
    throw error;
  }
}

function toCompanyPayload(input: SaveCompanyInput) {
  return {
    address: input.address || null,
    contact_email: input.contactEmail || null,
    contact_name: input.contactName || null,
    contact_phone: input.contactPhone || null,
    description: input.description || null,
    name: input.name,
    slug: normalizeSlug(input.slug, input.name),
    status: input.status || 'active',
    type: input.type || 'supplier',
    website_url: input.websiteUrl || null,
  };
}
