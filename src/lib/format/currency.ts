/**
 * Formats a numeric value as a localized currency string.
 *
 * @param value Numeric amount to format.
 * @param currency ISO 4217 currency code. Defaults to `EUR`.
 * @returns Localized currency text (for example `€1,200`), or a safe fallback on formatter failure.
 */
export function formatCurrency(value: number, currency = "EUR"): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${Math.round(value).toLocaleString()}`;
  }
}

/**
 * Convenience formatter for EUR values.
 *
 * @param value Numeric amount in EUR.
 * @returns Localized EUR currency text.
 */
export function formatEUR(value: number): string {
  return formatCurrency(value, "EUR");
}
