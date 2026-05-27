import type { QuoteStatus } from './types';

export type ProductInfoPublicStatus = 'active' | 'archived' | 'draft' | 'expired' | 'inactive';
export type FrontendUpdateType = 'admin_notice' | 'document_update' | 'new_product' | 'quote_update';

export const PUBLIC_VISIBLE_STATUSES = ['active'] as const;
export const MANAGEMENT_ONLY_STATUSES = ['draft', 'inactive'] as const;
export const HIDDEN_STATUSES = ['archived', 'expired'] as const;

export interface PublicVisibilityInput {
  documentVisible?: boolean | null;
  quoteLineStatus?: ProductInfoPublicStatus | string | null;
  quoteStatus?: ProductInfoPublicStatus | QuoteStatus | string | null;
  seriesStatus?: ProductInfoPublicStatus | string | null;
  variantStatus?: ProductInfoPublicStatus | string | null;
}

export interface FrontendUpdatePolicyInput extends PublicVisibilityInput {
  type: FrontendUpdateType | string;
}

export function isPublicStatus(status?: null | string) {
  return status === 'active';
}

export function isManagementOnlyStatus(status?: null | string) {
  return status === 'draft' || status === 'inactive';
}

export function isHiddenStatus(status?: null | string) {
  return status === 'archived' || status === 'expired';
}

export function canShowProductOnFrontend(input: PublicVisibilityInput) {
  return isPublicStatus(input.seriesStatus) && isPublicStatus(input.variantStatus);
}

export function canShowQuoteOnFrontend(input: PublicVisibilityInput) {
  return (
    canShowProductOnFrontend(input) &&
    isPublicStatus(input.quoteStatus) &&
    isPublicStatus(input.quoteLineStatus)
  );
}

export function canShowDocumentOnFrontend(input: PublicVisibilityInput) {
  return canShowProductOnFrontend(input) && input.documentVisible !== false;
}

export function canGenerateFrontendUpdate(input: FrontendUpdatePolicyInput) {
  if (input.type === 'admin_notice') return true;
  if (input.type === 'quote_update') return canShowQuoteOnFrontend(input);
  if (input.type === 'document_update') return canShowDocumentOnFrontend(input);
  if (input.type === 'new_product') return canShowProductOnFrontend(input);
  return false;
}

export function normalizeFrontendUpdateType(type: string): FrontendUpdateType | null {
  if (type === 'new_product' || type === 'quote_update' || type === 'document_update' || type === 'admin_notice') {
    return type;
  }
  return null;
}
