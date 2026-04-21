import type { MarketingClient, MonthKey, MonthlyPaymentStatus } from "@/lib/marketing/types";

export function monthKey(d = new Date()): MonthKey {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

export function formatMonthLabel(key: MonthKey): string {
  const [y, m] = key.split("-");
  const dt = new Date(Number(y), Number(m) - 1, 1);
  return new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(dt);
}

export function lastNMonths(n: number, from = new Date()): MonthKey[] {
  const out: MonthKey[] = [];
  const d = new Date(from.getFullYear(), from.getMonth(), 1);
  for (let i = 0; i < n; i++) {
    out.unshift(monthKey(d));
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}

export function getRecord(client: MarketingClient, key: MonthKey) {
  return client.records.find((r) => r.month === key) ?? null;
}

export function latestPaymentStatus(client: MarketingClient, key: MonthKey): MonthlyPaymentStatus {
  const r = getRecord(client, key);
  return r?.paymentStatus ?? "Unpaid";
}

export function lastPaymentDate(client: MarketingClient): string | null {
  const paid = client.records
    .filter((r) => r.paid && r.paidAt)
    .sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? ""));
  return paid[0]?.paidAt ?? null;
}

