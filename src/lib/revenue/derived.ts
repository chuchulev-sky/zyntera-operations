import type { Offer } from "@/lib/offers/types";
import type { CommitmentProject } from "@/lib/commitments/types";

export type MoneyByCurrency = Map<string, number>;

function addMoney(map: MoneyByCurrency, currency: string, amount: number) {
  if (!amount) return;
  map.set(currency, (map.get(currency) ?? 0) + amount);
}

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

export function calculateRevenueFromOffers(offers: Offer[]) {
  const active = offers.filter((o) => !o.isArchived);
  const estimated = new Map<string, number>();
  for (const o of active) addMoney(estimated, o.currency || "EUR", o.suggestedPrice || 0);
  return { estimated };
}

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

