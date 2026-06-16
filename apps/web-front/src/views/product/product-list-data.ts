export interface ProductDocLink {
  label: string;
  tone: 'blue' | 'red';
}

export interface ProductSpecLine {
  label: string;
  value: string;
}

export interface CatalogProduct {
  companyId?: string;
  id: string;
  name: string;
  model: string;
  summary: string;
  tags: string[];
  categorySlug: string;
  brandSlug: string;
  brandName: string;
  quoteRole: string;
  companyName: string;
  productId?: string;
  statusLabel?: string;
  updatedDate: string;
  updatedAgo: string;
  price: string;
  minimumOrder: string;
  image: string;
  docCount: number;
  docs: ProductDocLink[];
  specs: ProductSpecLine[];
}

export interface CategoryOption {
  count: number;
  label: string;
  slug: string;
}

export interface CategoryGroup {
  count: number;
  label: string;
  options: CategoryOption[];
}

export interface BrandFilter {
  count: number;
  label: string;
  slug: string;
}

export interface ProductNavItem {
  label: string;
  to: string;
}

export const productNavItems: ProductNavItem[] = [
  { label: '首页', to: '/' },
  { label: '产品', to: '/products' },
  { label: '分类', to: '/categories' },
  { label: '问答', to: '/qa-center' },
  { label: '资料', to: '/documents' },
  { label: '报价', to: '/quotes' },
  { label: '公司库', to: '/companies' },
  { label: '资讯', to: '/updates' },
];
