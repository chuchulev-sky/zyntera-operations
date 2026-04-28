import type { MarketingClient, MonthKey, MonthlyPaymentStatus } from "@/lib/marketing/types";

/**
 * Generates a month key in `YYYY-MM` format.
 *
 * @param d Optional date input. Defaults to current date.
 * @returns Month key string.
 */
export function monthKey(d = new Date()): MonthKey {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

/**
 * Converts a month key into a localized month/year label.
 *
 * @param key Month key in `YYYY-MM` format.
 * @returns Label like `Apr 2026`.
 */
export function formatMonthLabel(key: MonthKey): string {
  const [y, m] = key.split("-");
  const dt = new Date(Number(y), Number(m) - 1, 1);
  return new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(dt);
}

/**
 * Returns a list of the last `n` month keys ending at `from`.
 *
 * @param n Number of months to include.
 * @param from Anchor date for the range end.
 * @returns Ascending month key list.
 */
export function lastNMonths(n: number, from = new Date()): MonthKey[] {
  const out: MonthKey[] = [];
  const d = new Date(from.getFullYear(), from.getMonth(), 1);
  for (let i = 0; i < n; i++) {
    out.unshift(monthKey(d));
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}

/**
 * Finds the monthly record for a specific client/month pair.
 *
 * @param client Marketing client.
 * @param key Month key to find.
 * @returns Matching record or `null`.
 */
export function getRecord(client: MarketingClient, key: MonthKey) {
  return client.records.find((r) => r.month === key) ?? null;
}

/**
 * Returns payment status for the given month, defaulting to `Unpaid`.
 *
 * @param client Marketing client.
 * @param key Month key to evaluate.
 * @returns Payment status for the month.
 */
export function latestPaymentStatus(client: MarketingClient, key: MonthKey): MonthlyPaymentStatus {
  const r = getRecord(client, key);
  return r?.paymentStatus ?? "Unpaid";
}

/**
 * Finds the most recent paid-at date for a client.
 *
 * @param client Marketing client.
 * @returns Latest payment date ISO string, or `null` if none.
 */
export function lastPaymentDate(client: MarketingClient): string | null {
  const paid = client.records
    .filter((r) => r.paid && r.paidAt)
    .sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? ""));
  return paid[0]?.paidAt ?? null;
}

