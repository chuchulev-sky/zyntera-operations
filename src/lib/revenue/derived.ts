import type { Offer } from "@/lib/offers/types";
import type { CommitmentProject } from "@/lib/commitments/types";

export type MoneyByCurrency = Map<string, number>;

/**
 * Adds a numeric amount into a currency-keyed map.
 *
 * @param map Target currency aggregation map.
 * @param currency Currency code bucket.
 * @param amount Numeric amount to add.
 */
function addMoney(map: MoneyByCurrency, currency: string, amount: number) {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount === 0) return;
  map.set(currency, (map.get(currency) ?? 0) + amount);
}

/**
 * Formats a `MoneyByCurrency` map into a compact human-readable summary.
 *
 * @param map Aggregated money values grouped by currency.
 * @returns Summary text such as `€1,200 • USD 500`, or `—` when empty.
 */
export function formatMoneySummary(map: MoneyByCurrency): string {
  if (map.size === 0) return "—";
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([cur, val]) => {
      try {
        return new Intl.NumberFormat(undefined, { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(val);
      } catch {
        return `${cur} ${Math.round(val).toLocaleString()}`;
      }
    })
    .join(" • ");
}

/**
 * Sums suggested prices for non-archived offers still in the sales pipeline.
 * Excludes `Accepted` so totals are not double-counted with commitment `priceTotal`.
 */
export function calculateRevenueFromOffers(offers: Offer[]) {
  const active = offers.filter((o) => !o.isArchived && o.status !== "Accepted");
  const estimated = new Map<string, number>();
  for (const o of active) addMoney(estimated, o.currency || "EUR", o.suggestedPrice || 0);
  return { estimated };
}

/**
 * `outstanding` = accounts receivable on billed work: max(0, invoiced − paid) per project,
 * not remaining contract value (use priceTotal − paid if you need that separately).
 */
export function calculateRevenueFromCommitments(projects: CommitmentProject[]) {
  const active = projects.filter((p) => !p.isArchived);
  const confirmed = new Map<string, number>();
  const paid = new Map<string, number>();
  const outstanding = new Map<string, number>();

  for (const p of active) {
    const cur = p.currency || "EUR";
    addMoney(confirmed, cur, p.priceTotal || 0);
    addMoney(paid, cur, p.paidAmount || 0);
    const out = Math.max(0, (p.invoicedAmount || 0) - (p.paidAmount || 0));
    addMoney(outstanding, cur, out);
  }

  return { confirmed, paid, outstanding };
}

/**
 * Aggregates confirmed commitment revenue by project category and currency.
 *
 * @param projects Commitment projects to aggregate.
 * @returns Nested map: category -> currency -> amount.
 */
export function revenueSplitByCategory(projects: CommitmentProject[]) {
  const out = new Map<string, Map<string, number>>();
  for (const p of projects.filter((x) => !x.isArchived)) {
    const cat = p.category || "Website";
    const cur = p.currency || "EUR";
    const map = out.get(cat) ?? new Map<string, number>();
    map.set(cur, (map.get(cur) ?? 0) + (p.priceTotal || 0));
    out.set(cat, map);
  }
  return out;
}

