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

export type DocumentKind =
  | 'certificate'
  | 'drawing'
  | 'manual'
  | 'other'
  | 'product_image'
  | 'quote_workbook'
  | 'spec_sheet'
  | 'technical';

export type ProductCompanyRelationship =
  | 'brand_owner'
  | 'distributor'
  | 'manufacturer'
  | 'other'
  | 'supplier';

export type QuoteStatus = 'active' | 'archived' | 'draft' | 'expired';

export type QuoteLineStatus = 'active' | 'inactive';

export type QuoteOptionScopeType = 'batch' | 'line';

export type QuoteOptionType =
  | 'accessory'
  | 'firmware'
  | 'material_change'
  | 'other';

export type QuoteOptionDeltaType = 'decrease' | 'increase' | 'text_only';

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
  company_id: null | string;
  created_at: string;
  description: null | string;
  id: string;
  model: string;
  name: string;
  os_name?: null | string;
  os_version?: null | string;
  product_type?: null | string;
  ram_gb?: null | number;
  resolution_height?: null | number;
  resolution_width?: null | number;
  series_code?: null | string;
  series_id?: null | string;
  series_name?: null | string;
  size_inch?: null | number;
  spec_json: Record<string, unknown>;
  storage_gb?: null | number;
  summary_config_text?: null | string;
  status: ProductStatus | string;
  tags: string[];
  brightness_nits?: null | number;
  chipset?: null | string;
  poe_standard?: null | string;
  poe_supported?: null | boolean;
  updated_at: string;
}

export interface DocumentRecord {
  category: string;
  company_id: null | string;
  created_at: string;
  created_by: null | string;
  document_kind?: DocumentKind | null | string;
  file_type: DocumentFileType;
  file_url: string;
  id: string;
  is_primary?: boolean;
  product_id: null | string;
  product_model: null | string;
  quote_batch_id?: null | string;
  series_id?: null | string;
  sort_order?: number;
  source_sheet_name?: null | string;
  storage_path: null | string;
  tags: string[];
  title: string;
  updated_at: string;
  variant_id?: null | string;
}

export interface ProductCompanyRecord {
  company_id: string;
  created_at: string;
  notes: null | string;
  product_id: string;
  relationship_type: ProductCompanyRelationship | string;
}

export interface QuoteRecord {
  batch_id?: string;
  batch_title?: null | string;
  company_id: string;
  created_at: string;
  created_by: null | string;
  currency: string;
  effective_from?: null | string;
  firmware_note?: null | string;
  id: string;
  min_order_quantity: null | number;
  published_at?: null | string;
  product_id: string;
  product_model?: null | string;
  quote_no: null | string;
  quote_options?: QuoteOptionRecord[];
  quote_tiers?: QuotePriceTierRecord[];
  remarks: null | string;
  standard_config_text?: null | string;
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

export interface ProductSeriesRecord {
  base_description: null | string;
  brand_id: null | string;
  category_id: null | string;
  company_id: null | string;
  created_at: string;
  default_material: null | string;
  id: string;
  product_type: null | string;
  series_code: string;
  series_name: string;
  status: ProductStatus | string;
  updated_at: string;
}

export interface ProductVariantRecord {
  bluetooth_version: null | string;
  brightness_nits: null | number;
  camera_mp: null | number;
  chipset: null | string;
  created_at: string;
  display_name: string;
  ethernet_spec: null | string;
  id: string;
  material: null | string;
  model_code: string;
  os_name: null | string;
  os_version: null | string;
  poe_standard: null | string;
  poe_supported: null | boolean;
  ram_gb: null | number;
  resolution_height: null | number;
  resolution_width: null | number;
  series_id: string;
  size_inch: null | number;
  speaker_spec: null | string;
  status: ProductStatus | string;
  storage_gb: null | number;
  summary_config_text: null | string;
  touch_interface: null | string;
  touch_type: null | string;
  updated_at: string;
  vesa_spec: null | string;
  wifi_spec: null | string;
}

export interface ProductSpecItemRecord {
  created_at: string;
  id: string;
  is_filterable: boolean;
  section_key: string;
  section_label: string;
  sort_order: number;
  spec_key: string;
  spec_label: string;
  spec_value_number: null | number;
  spec_value_text: null | string;
  unit: null | string;
  updated_at: string;
  value_json: null | Record<string, unknown>;
  variant_id: string;
}

export interface QuoteBatchRecord {
  company_id: string;
  created_at: string;
  created_by: null | string;
  currency: string;
  effective_from: null | string;
  entry_mode: string;
  global_note: null | string;
  id: string;
  published_at: null | string;
  source_document_id: null | string;
  status: QuoteStatus | string;
  batch_title: string;
  updated_at: string;
}

export interface QuoteLineRecord {
  created_at: string;
  firmware_note: null | string;
  id: string;
  quote_batch_id: string;
  row_note: null | string;
  sort_order: number;
  standard_config_text: null | string;
  status: QuoteLineStatus | string;
  updated_at: string;
  variant_id: string;
}

export interface QuotePriceTierRecord {
  created_at: string;
  currency: string;
  id: string;
  max_quantity: null | number;
  min_quantity: number;
  quote_line_id: string;
  sort_order: number;
  unit_price: number;
  updated_at: string;
}

export interface QuoteOptionRecord {
  created_at: string;
  currency: null | string;
  delta_type: QuoteOptionDeltaType | string;
  description: null | string;
  id: string;
  option_name: string;
  option_type: QuoteOptionType | string;
  price_delta: null | number;
  quote_batch_id: null | string;
  quote_line_id: null | string;
  scope_type: QuoteOptionScopeType | string;
  sort_order: number;
  updated_at: string;
}

export interface UpdateRecord {
  content: null | string;
  created_at: string;
  created_by: null | string;
  id: string;
  new_value: null | string;
  old_value: null | string;
  product_model: null | string;
  quote_batch_id?: null | string;
  series_id?: null | string;
  title: string;
  type: UpdateType;
  variant_id?: null | string;
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
