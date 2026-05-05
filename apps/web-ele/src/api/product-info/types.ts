export type ProductStatus = 'active' | 'inactive';

export type CategoryStatus = 'active' | 'inactive';

export type BrandStatus = 'active' | 'inactive';

export type CompanyStatus = 'active' | 'inactive';

export type CompanyType =
  | 'brand_owner'
  | 'distributor'
  | 'manufacturer'
  | 'other'
  | 'supplier';

export type DocumentFileType =
  | 'image'
  | 'other'
  | 'quote'
  | 'spec'
  | 'technical';

export type ProductCompanyRelationship =
  | 'brand_owner'
  | 'distributor'
  | 'manufacturer'
  | 'other'
  | 'supplier';

export type QuoteStatus = 'active' | 'archived' | 'draft' | 'expired';

export type UpdateType = 'notice' | 'price_update' | 'product';

export type UserRole = 'admin' | 'user';

export interface CategoryRecord {
  created_at: string;
  description: null | string;
  id: string;
  name: string;
  parent_id: null | string;
  slug: string;
  sort_order: number;
  status: CategoryStatus | string;
  updated_at: string;
}

export interface BrandRecord {
  aliases: string[];
  created_at: string;
  description: null | string;
  id: string;
  name: string;
  slug: string;
  status: BrandStatus | string;
  updated_at: string;
  website_url: null | string;
}

export interface CompanyRecord {
  address: null | string;
  contact_email: null | string;
  contact_name: null | string;
  contact_phone: null | string;
  created_at: string;
  description: null | string;
  id: string;
  name: string;
  slug: string;
  status: CompanyStatus | string;
  type: CompanyType | string;
  updated_at: string;
  website_url: null | string;
}

export interface ProductRecord {
  brand_id: null | string;
  category: string;
  category_id: null | string;
  created_at: string;
  description: null | string;
  id: string;
  model: string;
  name: string;
  spec_json: Record<string, unknown>;
  status: ProductStatus | string;
  tags: string[];
  updated_at: string;
}

export interface DocumentRecord {
  category: string;
  company_id: null | string;
  created_at: string;
  created_by: null | string;
  file_type: DocumentFileType;
  file_url: string;
  id: string;
  product_id: null | string;
  product_model: null | string;
  storage_path: null | string;
  tags: string[];
  title: string;
  updated_at: string;
}

export interface ProductCompanyRecord {
  company_id: string;
  created_at: string;
  notes: null | string;
  product_id: string;
  relationship_type: ProductCompanyRelationship | string;
}

export interface QuoteRecord {
  company_id: string;
  created_at: string;
  created_by: null | string;
  currency: string;
  id: string;
  min_order_quantity: null | number;
  product_id: string;
  quote_no: null | string;
  remarks: null | string;
  status: QuoteStatus | string;
  unit_price: null | number;
  updated_at: string;
  valid_from: null | string;
  valid_until: null | string;
}

export interface QuoteWithRelations extends QuoteRecord {
  company?: CompanyRecord | null;
  product?: null | ProductRecord;
}

export interface QuoteDocumentRecord {
  created_at: string;
  document_id: string;
  quote_id: string;
}

export interface UpdateRecord {
  content: null | string;
  created_at: string;
  created_by: null | string;
  id: string;
  new_value: null | string;
  old_value: null | string;
  product_model: null | string;
  title: string;
  type: UpdateType;
}

export interface ProfileRecord {
  created_at: string;
  email: string;
  id: string;
  name: null | string;
  role: UserRole;
  updated_at: string;
}

export interface ListParams {
  keyword?: string;
}
