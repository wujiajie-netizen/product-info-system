import type { ProductRecord } from '#/api';
import type { WorkBook } from 'xlsx';

import { read } from 'xlsx';

export interface ExcelImageCandidate {
  file: File;
  fileName: string;
  matchedProduct?: ProductRecord;
  mimeType: string;
  rowKey: string;
  status: 'matched' | 'pending';
  warning: string;
}

const IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  bmp: 'image/bmp',
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function normalizeText(value: unknown) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function getWorkbookFiles(workbook: WorkBook) {
  return ((workbook as unknown) as { files?: Record<string, { content?: ArrayBuffer | Uint8Array | string }> }).files || {};
}

function inferMimeType(path: string) {
  const extension = path.split('.').pop()?.toLowerCase() || 'png';
  return IMAGE_MIME_BY_EXTENSION[extension] || 'application/octet-stream';
}

function toBlobPart(content: ArrayBuffer | Uint8Array | string | undefined): BlobPart {
  if (!content) return new ArrayBuffer(0);
  if (typeof content === 'string') return Uint8Array.from(content, (char) => char.charCodeAt(0)).buffer;
  if (content instanceof Uint8Array) return new Uint8Array(content).buffer;
  return content;
}

function matchProductByImageName(fileName: string, products: ProductRecord[]) {
  const normalizedFileName = normalizeText(fileName);
  return products.find((product) => {
    const model = normalizeText(product.model);
    const name = normalizeText(product.name);
    return Boolean(model && normalizedFileName.includes(model)) || Boolean(name && normalizedFileName.includes(name));
  });
}

export async function extractExcelEmbeddedImages(file: File, products: ProductRecord[]) {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { bookFiles: true, type: 'array' });
  const workbookFiles = getWorkbookFiles(workbook);
  const imageEntries = Object.entries(workbookFiles).filter(([path]) => /xl\/media\/.+\.(png|jpe?g|gif|bmp|webp)$/i.test(path));

  return imageEntries.map(([path, entry], index) => {
    const fileName = path.split('/').pop() || `excel-image-${index + 1}.png`;
    const mimeType = inferMimeType(fileName);
    const imageFile = new File([toBlobPart(entry.content)], fileName, { type: mimeType });
    const matchedProduct = matchProductByImageName(fileName, products);

    return {
      file: imageFile,
      fileName,
      matchedProduct,
      mimeType,
      rowKey: `${file.name}-${fileName}-${index}`,
      status: matchedProduct ? 'matched' : 'pending',
      warning: matchedProduct ? '' : '未能根据图片文件名匹配型号，请手动选择关联产品',
    } satisfies ExcelImageCandidate;
  });
}
