import { countDocuments } from './documents';
import { countProducts } from './products';
import { countQuotes } from './quotes';
import { listUpdates, countThisWeekUpdates } from './updates';

export async function getDashboardSummary() {
  const [
    productCount,
    documentCount,
    quoteCount,
    weekUpdateCount,
    latestUpdates,
  ] = await Promise.all([
    countProducts(),
    countDocuments(),
    countQuotes(),
    countThisWeekUpdates(),
    listUpdates(),
  ]);

  return {
    documentCount,
    latestUpdates: latestUpdates.slice(0, 5),
    productCount,
    quoteCount,
    pendingDocumentCount: 0,
    weekUpdateCount,
  };
}
