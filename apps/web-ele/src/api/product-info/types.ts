export type ProductStatus = 'active' | 'inactive';

export type DocumentFileType =
  | 'image'
  | 'other'
  | 'quote'
  | 'spec'
  | 'technical';

export type UpdateType = 'notice' | 'price_update' | 'product';

export type UserRole = 'admin' | 'user';

export interface ProductRecord {
  category: string;
  created_at: string;
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
  created_at: string;
  created_by: null | string;
  file_type: DocumentFileType;
  file_url: string;
  id: string;
  product_model: null | string;
  storage_path: null | string;
  tags: string[];
  title: string;
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
