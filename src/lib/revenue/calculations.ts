import type { Project } from "@/lib/projects/types";
import type { MarketingClient } from "@/lib/marketing/types";
import { monthKey as currentMonthKey, latestPaymentStatus } from "@/lib/marketing/helpers";

export type MoneyByCurrency = Map<string, number>;

/**
 * Adds a numeric amount into a currency-keyed map.
 *
 * @param map Target aggregation map.
 * @param currency Currency code bucket.
 * @param amount Numeric amount to add.
 */
export function addMoney(map: MoneyByCurrency, currency: string, amount: number) {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount === 0) return;
  map.set(currency, (map.get(currency) ?? 0) + amount);
}

/**
 * Formats a `MoneyByCurrency` map into a compact readable string.
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
        return new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: cur,
          maximumFractionDigits: 0,
        }).format(val);
      } catch {
        return `${cur} ${Math.round(val).toLocaleString()}`;
      }
    })
    .join(" • ");
}

/** `proposal` sums proposal amounts only for Lead + Proposal Sent (open proposal stage). */
export function calculateWebsitesSummary(projects: Project[]) {
  const active = projects.filter((p) => !p.isArchived);
  const proposal = new Map<string, number>();
  const won = new Map<string, number>();
  const invoiced = new Map<string, number>();
  const paid = new Map<string, number>();
  const outstanding = new Map<string, number>(); // invoiced - paid (>=0)

  const soldStatuses = new Set([
    "Won",
    "Scheduled",
    "In Progress",
    "Waiting for Client",
    "Blocked",
    "Completed",
  ]);

  const proposalPipelineStatuses = new Set<Project["status"]>(["Lead", "Proposal Sent"]);

  for (const p of active) {
    const cur = p.currency || "EUR";
    if (proposalPipelineStatuses.has(p.status)) addMoney(proposal, cur, p.proposalAmount || 0);
    addMoney(invoiced, cur, p.invoicedAmount || 0);
    addMoney(paid, cur, p.paidAmount || 0);
    if (soldStatuses.has(p.status)) addMoney(won, cur, p.agreedAmount || 0);
    const out = Math.max(0, (p.invoicedAmount || 0) - (p.paidAmount || 0));
    addMoney(outstanding, cur, out);
  }

  return { proposal, won, invoiced, paid, outstanding };
}

/**
 * Computes this month's marketing recurring totals.
 *
 * @param marketingClients Marketing client contracts.
 * @param month Target month key (`YYYY-MM`) to evaluate payment status.
 * @returns MRR, collected, and unpaid totals for the month.
 */
export function calculateMarketingThisMonth(marketingClients: MarketingClient[], month = currentMonthKey()) {
  const currency = "EUR";
  const active = marketingClients.filter((c) => c.status === "Active");

  const mrr = new Map<string, number>();
  const collected = new Map<string, number>();
  const unpaid = new Map<string, number>();

  const mrrGross = active.reduce((acc, c) => acc + (c.monthlyFee || 0), 0);
  addMoney(mrr, currency, mrrGross);

  for (const c of active) {
    const st = latestPaymentStatus(c, month);
    if (st === "Paid") addMoney(collected, currency, c.monthlyFee);
    else addMoney(unpaid, currency, c.monthlyFee);
  }

  return { month, mrr, collected, unpaid };
}

/**
 * Builds a combined revenue summary for website projects and marketing retainers.
 *
 * @param projects Website pipeline projects.
 * @param marketingClients Marketing retainer clients.
 * @param month Target month key (`YYYY-MM`) for marketing calculations.
 * @returns Aggregated revenue summary object for dashboards.
 */
export function calculateRevenueSummary(projects: Project[], marketingClients: MarketingClient[], month = currentMonthKey()) {
  const websites = calculateWebsitesSummary(projects);
  const marketing = calculateMarketingThisMonth(marketingClients, month);

  return {
    month,
    websites,
    marketing,
  };
}

export type RevenueByOwnerRow = {
  owner: string;
  currency: string;
  won: number;
  paid: number;
};

/**
 * Aggregates won (agreed) and paid amounts per owner **and** project currency.
 * Use `formatMoneySummary` per currency group for display — do not assume EUR-only totals.
 *
 * @param projects Website pipeline projects.
 * @returns Owner/currency grouped revenue rows.
 */
export function revenueByOwner(projects: Project[]): { rows: RevenueByOwnerRow[] } {
  const active = projects.filter((p) => !p.isArchived);
  const soldStatuses = new Set([
    "Won",
    "Scheduled",
    "In Progress",
    "Waiting for Client",
    "Blocked",
    "Completed",
  ]);

  const acc = new Map<string, RevenueByOwnerRow>();

  for (const p of active) {
    const owner = p.sourceOwner || "Team";
    const currency = p.currency || "EUR";
    const key = `${owner}\0${currency}`;
    const row = acc.get(key) ?? { owner, currency, won: 0, paid: 0 };
    if (soldStatuses.has(p.status)) row.won += p.agreedAmount || 0;
    row.paid += p.paidAmount || 0;
    acc.set(key, row);
  }

  return { rows: Array.from(acc.values()).sort((a, b) => a.owner.localeCompare(b.owner) || a.currency.localeCompare(b.currency)) };
}

