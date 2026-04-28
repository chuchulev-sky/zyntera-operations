import type { CommitmentProject } from "@/lib/commitments/types";
import type { EstimatorCategory } from "@/lib/estimator/types";

export type Dept = "Development" | "Marketing" | "Design";

/**
 * Maps estimator category into the operational department used by capacity planning.
 *
 * @param category Selected estimator category.
 * @returns Department key used by capacity calculators.
 */
export function deptForCategory(category: EstimatorCategory): Dept {
  return category === "Marketing" ? "Marketing" : category === "Design" ? "Design" : "Development";
}

/**
 * Formats a date with medium locale style and falls back to ISO date.
 *
 * @param d Date to format.
 * @returns Human-readable date string.
 */
export function formatDate(d: Date): string {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/**
 * Small utility that merges conditional class segments.
 *
 * @param parts Class string fragments, including optional falsy entries.
 * @returns A space-separated class string with falsy values removed.
 */
export function cls(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * Builds the estimator metadata block that is appended into offer notes.
 *
 * @param args Structured estimator values used to annotate an offer.
 * @param args.notes Free-form user notes.
 * @param args.urgency Selected urgency level.
 * @param args.minimumPrice Baseline internal price in EUR.
 * @param args.recommendedPrice Recommended commercial price in EUR.
 * @param args.rangeMin Lower bound of suggested range in EUR.
 * @param args.rangeMax Upper bound of suggested range in EUR.
 * @param args.riskLevel Computed risk level.
 * @param args.capacityImpact Computed capacity impact.
 * @returns Multi-line notes string suitable for persistence.
 */
export function buildEstimatorOfferNotes(args: {
  notes: string;
  urgency: string;
  minimumPrice: number;
  recommendedPrice: number;
  rangeMin: number;
  rangeMax: number;
  riskLevel: string;
  capacityImpact: string;
}) {
  const { notes, urgency, minimumPrice, recommendedPrice, rangeMin, rangeMax, riskLevel, capacityImpact } = args;
  return [
    notes.trim(),
    "",
    `Estimator: urgency=${urgency}`,
    `Estimator: min=${minimumPrice} EUR, recommended=${recommendedPrice} EUR, range=${rangeMin}-${rangeMax} EUR`,
    `Estimator: risk=${riskLevel}, capacityImpact=${capacityImpact}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Builds the estimator metadata block that is appended into commitment project notes.
 *
 * @param args Structured estimator values used to annotate a project.
 * @param args.notes Free-form user notes.
 * @param args.urgency Selected urgency level.
 * @param args.riskLevel Computed risk level.
 * @param args.capacityImpact Computed capacity impact.
 * @param args.minimumPrice Baseline internal price in EUR.
 * @param args.recommendedPrice Recommended commercial price in EUR.
 * @param args.rangeMin Lower bound of suggested range in EUR.
 * @param args.rangeMax Upper bound of suggested range in EUR.
 * @returns Multi-line notes string suitable for persistence.
 */
export function buildEstimatorProjectNotes(args: {
  notes: string;
  urgency: string;
  riskLevel: string;
  capacityImpact: string;
  minimumPrice: number;
  recommendedPrice: number;
  rangeMin: number;
  rangeMax: number;
}) {
  const { notes, urgency, riskLevel, capacityImpact, minimumPrice, recommendedPrice, rangeMin, rangeMax } = args;
  return [
    notes.trim(),
    "",
    `Created from Estimator: urgency=${urgency}, risk=${riskLevel}, capacityImpact=${capacityImpact}`,
    `Pricing: min=${minimumPrice} EUR, recommended=${recommendedPrice} EUR, range=${rangeMin}-${rangeMax} EUR`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Fetches active (non-archived) commitment projects for capacity calculations.
 *
 * @returns Promise resolving to active commitment project list.
 */
export async function fetchActiveCommitmentProjects(): Promise<CommitmentProject[]> {
  const res = await fetch("/api/projects", { cache: "no-store" });
  const json = (await res.json()) as { projects?: CommitmentProject[] };
  return (json.projects ?? []).filter((p) => !p.isArchived);
}
