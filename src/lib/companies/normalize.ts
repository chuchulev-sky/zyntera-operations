export function normalizeCompanyName(name: string): string {
  return String(name ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

