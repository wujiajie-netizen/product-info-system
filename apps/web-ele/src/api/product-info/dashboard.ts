import { countDocuments } from './documents';
import { countProducts } from './products';
import { listUpdates, countThisWeekUpdates } from './updates';

export async function getDashboardSummary() {
  const [productCount, documentCount, weekUpdateCount, latestUpdates] =
    await Promise.all([
      countProducts(),
      countDocuments(),
      countThisWeekUpdates(),
      listUpdates(),
    ]);

  return {
    documentCount,
    latestUpdates: latestUpdates.slice(0, 5),
    productCount,
    pendingDocumentCount: 0,
    weekUpdateCount,
  };
}
