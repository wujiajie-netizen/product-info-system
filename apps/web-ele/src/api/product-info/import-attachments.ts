import type { DocumentRecord } from './types';

import { createDocument } from './documents';

export interface SaveQuoteWorkbookAttachmentInput {
  companyId?: string;
  file: File;
  quoteBatchIds: string[];
  sourceSheetName?: string;
  title?: string;
}

export async function saveQuoteWorkbookAttachments(input: SaveQuoteWorkbookAttachmentInput) {
  const quoteBatchIds = [...new Set(input.quoteBatchIds.filter(Boolean))];

  if (!quoteBatchIds.length) {
    return [] as DocumentRecord[];
  }

  const title = input.title?.trim() || input.file.name;
  const documents: DocumentRecord[] = [];

  for (const quoteBatchId of quoteBatchIds) {
    const document = await createDocument({
      category: 'quote_workbook',
      companyId: input.companyId,
      documentKind: 'quote_workbook',
      file: input.file,
      fileType: 'quote',
      quoteBatchId,
      sourceSheetName: input.sourceSheetName,
      tags: ['Excel导入', '原始报价附件'],
      title,
    });
    documents.push(document);
  }

  return documents;
}
