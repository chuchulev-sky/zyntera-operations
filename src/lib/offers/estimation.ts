import type { ServiceCategory } from "@/lib/services/catalog";
import { estimateMarketingRetainer, isMarketingService } from "@/lib/marketing/estimates";

export type OfferCategory = "Website" | "Marketing" | "Design";
export type OfferComplexity = "Low" | "Medium" | "High" | "Preliminary" | "Custom";

export type SelectedService = {
  name: string;
  category: ServiceCategory;
};

export type Department = "WebDesign" | "Development" | "Marketing" | "UIUX" | "Branding";

export type EstimationResult = {
  estimatedHoursTotal: number;
  estimatedTimelineDays: number;
  suggestedPrice: number;
  currency: "EUR";
  workloadByDepartment: Record<Department, number>;
};

const COMPLEXITY_MULTIPLIER: Record<OfferComplexity, number> = {
  Low: 0.85,
  Medium: 1,
  High: 1.25,
  Preliminary: 0.6,
  Custom: 1.4,
};

const DEFAULT_HOURLY_RATE_EUR = 55;

type ServiceEstimation = {
  hours: number;
  department: Department;
};

// Sensible defaults. Later: make editable via DB config.
const SERVICE_DEFAULTS: Record<string, ServiceEstimation[]> = {
  "Website Development": [
    { department: "WebDesign", hours: 12 },
    { department: "Development", hours: 48 },
  ],
  "E-commerce": [
    { department: "WebDesign", hours: 16 },
    { department: "Development", hours: 72 },
  ],
  "Custom Web App": [
    { department: "UIUX", hours: 24 },
    { department: "Development", hours: 120 },
  ],
  "UI/UX Design": [{ department: "UIUX", hours: 40 }],
  Branding: [{ department: "Branding", hours: 28 }],
  "Facebook Ads": [{ department: "Marketing", hours: 10 }],
  "Google Ads": [{ department: "Marketing", hours: 10 }],
  SEO: [{ department: "Marketing", hours: 12 }],
  "Social Media Management": [{ department: "Marketing", hours: 14 }],
  "Email Marketing": [{ department: "Marketing", hours: 8 }],
};

function round1(v: number) {
  return Math.round(v * 10) / 10;
}

function sumWorkload(entries: Array<{ department: Department; hours: number }>): Record<Department, number> {
  return entries.reduce(
    (acc, e) => {
      acc[e.department] = round1((acc[e.department] ?? 0) + e.hours);
      return acc;
    },
    {
      WebDesign: 0,
      Development: 0,
      Marketing: 0,
      UIUX: 0,
      Branding: 0,
    } as Record<Department, number>
  );
}

export function estimateOffer(input: {
  category: OfferCategory;
  complexity: OfferComplexity;
  selectedServices: SelectedService[];
  creativesPerMonth?: number;
}): EstimationResult {
  const multiplier = COMPLEXITY_MULTIPLIER[input.complexity] ?? 1;

  // Marketing retainers: estimate monthly hours/fee and map to Marketing dept.
  // Even for mixed offers, this gives reasonable results for marketing services.
  const marketingForRetainer = input.selectedServices
    .filter((s) => s.category === "Marketing")
    .map((s) => s.name)
    .filter(isMarketingService);
  const marketingRetainer = marketingForRetainer.length
    ? estimateMarketingRetainer(marketingForRetainer, input.creativesPerMonth ?? 0)
    : { hoursPerMonth: 0, monthlyFeeEUR: 0 };

  const perServiceEntries: Array<{ department: Department; hours: number }> = [];
  for (const s of input.selectedServices) {
    const defs = SERVICE_DEFAULTS[s.name] ?? [];
    for (const d of defs) perServiceEntries.push({ department: d.department, hours: d.hours });
  }

  // Replace marketing hours with retainer-calculated hours if marketing services exist.
  const nonMarketing = perServiceEntries.filter((e) => e.department !== "Marketing");
  const marketingHours = marketingRetainer.hoursPerMonth || perServiceEntries.filter((e) => e.department === "Marketing").reduce((a, e) => a + e.hours, 0);

  const workloadRaw = sumWorkload([
    ...nonMarketing,
    ...(marketingHours ? [{ department: "Marketing" as const, hours: marketingHours }] : []),
  ]);

  const workload = Object.fromEntries(
    Object.entries(workloadRaw).map(([k, v]) => [k, round1(v * multiplier)])
  ) as Record<Department, number>;

  const estimatedHoursTotal = round1(Object.values(workload).reduce((a, b) => a + b, 0));

  // Timeline: assume 30 hours/week effective throughput by default.
  const assumedHoursPerWeek = 30;
  const estimatedTimelineDays = Math.max(3, Math.round((estimatedHoursTotal / assumedHoursPerWeek) * 7));

  const hoursPrice = Math.round(estimatedHoursTotal * DEFAULT_HOURLY_RATE_EUR);
  const marketingOnly =
    input.category === "Marketing" && input.selectedServices.every((s) => s.category === "Marketing");
  // Pure retainer: guideline monthly fee. Mixed bundles: hourly valuation + MRR guideline (not double-counted as marketing-only).
  const basePrice = marketingOnly
    ? marketingRetainer.monthlyFeeEUR
    : hoursPrice + (marketingForRetainer.length ? marketingRetainer.monthlyFeeEUR : 0);

  return {
    estimatedHoursTotal,
    estimatedTimelineDays,
    suggestedPrice: basePrice,
    currency: "EUR",
    workloadByDepartment: workload,
  };
}

