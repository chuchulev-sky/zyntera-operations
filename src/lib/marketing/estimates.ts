import { MARKETING_SERVICES, type MarketingService } from "@/lib/marketing/types";

export type MarketingServiceEstimate = {
  hoursPerMonth: number;
  monthlyFeeEUR: number; // gross guideline
};

const DEFAULTS: Record<MarketingService, MarketingServiceEstimate> = {
  "Facebook Ads": { hoursPerMonth: 10, monthlyFeeEUR: 900 },
  "Google Ads": { hoursPerMonth: 10, monthlyFeeEUR: 900 },
  SEO: { hoursPerMonth: 12, monthlyFeeEUR: 800 },
  "Social Media Management": { hoursPerMonth: 14, monthlyFeeEUR: 700 },
  "Email Marketing": { hoursPerMonth: 8, monthlyFeeEUR: 450 },
};

/**
 * Runtime type guard for marketing service names.
 *
 * @param v Unknown value to validate.
 * @returns `true` when `v` is a supported `MarketingService`.
 */
export function isMarketingService(v: unknown): v is MarketingService {
  return typeof v === "string" && (MARKETING_SERVICES as readonly string[]).includes(v);
}

/**
 * Estimates monthly retainer workload and guideline fee from selected services.
 *
 * @param services Selected marketing services.
 * @param creativesPerMonth Optional creatives count used for production overhead.
 * @returns Estimated monthly hours and gross guideline fee in EUR.
 */
export function estimateMarketingRetainer(services: MarketingService[], creativesPerMonth = 0) {
  const base = services.reduce(
    (acc, s) => {
      const est = DEFAULTS[s];
      if (!est) return acc;
      acc.hoursPerMonth += est.hoursPerMonth;
      acc.monthlyFeeEUR += est.monthlyFeeEUR;
      return acc;
    },
    { hoursPerMonth: 0, monthlyFeeEUR: 0 }
  );

  // Light heuristic: add production overhead per creative.
  const creatives = Math.max(0, creativesPerMonth || 0);
  const extraHours = creatives * 0.5;
  const extraFee = creatives * 25;

  return {
    hoursPerMonth: Math.round((base.hoursPerMonth + extraHours) * 10) / 10,
    monthlyFeeEUR: Math.round(base.monthlyFeeEUR + extraFee),
  };
}

