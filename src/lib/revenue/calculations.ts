import type { Project } from "@/lib/projects/types";
import type { MarketingClient } from "@/lib/marketing/types";
import { monthKey as currentMonthKey, latestPaymentStatus } from "@/lib/marketing/helpers";

export type MoneyByCurrency = Map<string, number>;

export function addMoney(map: MoneyByCurrency, currency: string, amount: number) {
  if (!amount) return;
  map.set(currency, (map.get(currency) ?? 0) + amount);
}

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

  for (const p of active) {
    const cur = p.currency || "EUR";
    addMoney(proposal, cur, p.proposalAmount || 0);
    addMoney(invoiced, cur, p.invoicedAmount || 0);
    addMoney(paid, cur, p.paidAmount || 0);
    if (soldStatuses.has(p.status)) addMoney(won, cur, p.agreedAmount || 0);
    const out = Math.max(0, (p.invoicedAmount || 0) - (p.paidAmount || 0));
    addMoney(outstanding, cur, out);
  }

  return { proposal, won, invoiced, paid, outstanding };
}

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

export function calculateRevenueSummary(projects: Project[], marketingClients: MarketingClient[], month = currentMonthKey()) {
  const websites = calculateWebsitesSummary(projects);
  const marketing = calculateMarketingThisMonth(marketingClients, month);

  return {
    month,
    websites,
    marketing,
  };
}

export function revenueByOwner(projects: Project[]) {
  const active = projects.filter((p) => !p.isArchived);
  const soldStatuses = new Set([
    "Won",
    "Scheduled",
    "In Progress",
    "Waiting for Client",
    "Blocked",
    "Completed",
  ]);

  const wonByOwner = new Map<string, number>();
  const paidByOwner = new Map<string, number>();

  for (const p of active) {
    const owner = p.sourceOwner || "Team";
    if (soldStatuses.has(p.status)) wonByOwner.set(owner, (wonByOwner.get(owner) ?? 0) + (p.agreedAmount || 0));
    paidByOwner.set(owner, (paidByOwner.get(owner) ?? 0) + (p.paidAmount || 0));
  }

  return { wonByOwner, paidByOwner, currency: "EUR" as const };
}

