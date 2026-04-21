import type {
  CapacityImpact,
  EstimatorCategory,
  EstimatorComplexity,
  EstimatorInput,
  EstimatorResult,
  EstimatorUrgency,
  RiskLevel,
} from "@/lib/estimator/types";

// Pricing model (real agency baseline vs target)
export const INTERNAL_BASE_RATE_EUR = 18;
export const TARGET_RATE_EUR = 35;
const TARGET_MULTIPLIER = 1.1;

const COMPLEXITY_MULT: Record<EstimatorComplexity, number> = {
  Low: 0.9,
  Medium: 1.0,
  High: 1.15,
  Custom: 1.25,
};

const URGENCY_MULT: Record<EstimatorUrgency, number> = {
  Normal: 1.0,
  Fast: 1.15,
  Urgent: 1.3,
};

export function calculateEstimatedHours(input: EstimatorInput) {
  const drivers: string[] = [];
  const expensiveFactors: string[] = [];
  const riskFactors: string[] = [];

  let hours = 0;

  // Category-specific adjustments
  if (input.category === "Website" && input.website) {
    const w = input.website;
    const baseByType =
      w.websiteType === "Landing Page"
        ? 30 // 20–40h
        : w.websiteType === "Corporate Website"
          ? 90 // 60–120h
          : w.websiteType === "E-commerce"
            ? 160 // 120–200h
            : 220; // Custom web app (kept higher)

    hours += baseByType;
    drivers.push(`Website type: ${w.websiteType}`);

    const extraPages = Math.max(0, (w.pageCount ?? 0) - 5);
    if (extraPages) {
      // Pages should not be the primary driver.
      hours += extraPages * 1.0;
      expensiveFactors.push(`Extra pages (+${extraPages})`);
    }

    if (w.multilingual) {
      hours += 12;
      expensiveFactors.push("Multilingual");
      riskFactors.push("Multilingual content/QA");
    }

    if (w.cmsRequired) {
      hours += 8;
      expensiveFactors.push("CMS required");
    }

    if ((w.customFeatures ?? []).length) {
      const n = (w.customFeatures ?? []).length;
      hours += n * 7;
      expensiveFactors.push(`Features/integrations × ${n}`);
      riskFactors.push("Features/integrations increase scope risk");
    }

    if (!w.contentReady) {
      hours += 8;
      riskFactors.push("Content not ready");
    }

    if (w.seoSetupIncluded) {
      hours += 4;
      expensiveFactors.push("SEO setup");
    }

    if (w.uiuxIncluded) {
      hours += 22;
      expensiveFactors.push("UI/UX depth");
    }

    if (w.brandingIncluded) {
      hours += 25; // Branding 15–40h (midpoint-ish)
      expensiveFactors.push("Branding");
    }

    if (w.expectedRevisions === "Medium") {
      hours += 8;
      riskFactors.push("Medium revisions");
    } else if (w.expectedRevisions === "High") {
      hours += 16;
      expensiveFactors.push("High revisions");
      riskFactors.push("High revisions");
    }
  }

  if (input.category === "Design") {
    // UI/UX sizing (grounded ranges)
    // We derive size from websiteType as a simple proxy to avoid another input field.
    const size =
      input.website?.websiteType === "Landing Page"
        ? "Small"
        : input.website?.websiteType === "Corporate Website"
          ? "Medium"
          : "Large";
    const base = size === "Small" ? 15 : size === "Medium" ? 30 : 60; // 10–20 / 20–40 / 40–80
    hours += base;
    drivers.push(`Design size: ${size}`);
  }

  if (input.category === "Marketing" && input.marketing) {
    const m = input.marketing;
    // Monthly retainer hours (10–20 / 20–40 / 40–80)
    const tier =
      m.reportingLevel === "Advanced" || m.campaignComplexity === "High"
        ? "Advanced"
        : m.reportingLevel === "Standard" || m.campaignComplexity === "Medium"
          ? "Medium"
          : "Basic";
    const baseMonthly = tier === "Basic" ? 15 : tier === "Medium" ? 30 : 60;
    hours += baseMonthly;
    drivers.push(`Marketing tier: ${tier}`);

    const channelCount = (m.channels ?? []).length;
    if (channelCount) {
      hours += Math.min(18, channelCount * 3);
      drivers.push(`Channels × ${channelCount}`);
    }

    const creatives = Math.max(0, m.creativesPerMonth ?? 0);
    if (creatives) {
      hours += Math.min(20, creatives * 0.3);
      expensiveFactors.push("Creatives volume");
    }

    if (m.landingPageSupport) {
      hours += 6;
      expensiveFactors.push("Landing page support");
    }
  }

  // Global multipliers
  const complexityMult = COMPLEXITY_MULT[input.complexity] ?? 1;
  const urgencyMult = URGENCY_MULT[input.urgency] ?? 1;

  if (input.complexity !== "Medium") drivers.push(`Complexity: ${input.complexity}`);
  if (input.urgency !== "Normal") drivers.push(`Urgency: ${input.urgency}`);

  hours = hours * complexityMult * urgencyMult;

  // Clamp to realistic bands where applicable
  if (input.category === "Website" && input.website) {
    const min =
      input.website.websiteType === "Landing Page"
        ? 20
        : input.website.websiteType === "Corporate Website"
          ? 60
          : input.website.websiteType === "E-commerce"
            ? 120
            : 140;
    const max =
      input.website.websiteType === "Landing Page"
        ? 40
        : input.website.websiteType === "Corporate Website"
          ? 120
          : input.website.websiteType === "E-commerce"
            ? 200
            : 320;
    hours = Math.min(max, Math.max(min, hours));
  }

  const rounded = Math.max(8, Math.round(hours));
  return {
    estimatedHours: rounded,
    drivers,
    expensiveFactors,
    riskFactors,
  };
}

export function calculateTimelineDays(estimatedHours: number, urgency: EstimatorUrgency) {
  const throughputPerWeek = urgency === "Urgent" ? 42 : urgency === "Fast" ? 36 : 30;
  const days = Math.max(3, Math.round((estimatedHours / throughputPerWeek) * 7));
  return days;
}

export function calculatePricing(estimatedHours: number, category: EstimatorCategory, complexity: EstimatorComplexity) {
  // Keep it grounded: no category inflation; complexity affects risk not rate.
  const minimumPrice = Math.round(estimatedHours * INTERNAL_BASE_RATE_EUR);
  const recommendedPrice = Math.round(estimatedHours * TARGET_RATE_EUR * TARGET_MULTIPLIER);

  return {
    internalBaseRate: INTERNAL_BASE_RATE_EUR,
    targetRate: TARGET_RATE_EUR,
    minimumPrice,
    recommendedPrice,
    suggestedRange: { min: minimumPrice, max: recommendedPrice },
  };
}

export function calculateRiskLevel(input: EstimatorInput, estimatedHours: number): { riskLevel: RiskLevel; riskFactors: string[] } {
  const factors: string[] = [];
  let score = 0;

  if (input.complexity === "High") score += 2;
  if (input.complexity === "Custom") score += 3;
  if (input.urgency === "Fast") score += 1;
  if (input.urgency === "Urgent") score += 2;
  if (estimatedHours >= 120) score += 2;
  if (estimatedHours >= 200) score += 2;

  if (input.category === "Website" && input.website) {
    if (!input.website.contentReady) {
      score += 1;
      factors.push("Content not ready");
    }
    if ((input.website.customFeatures ?? []).length >= 3) {
      score += 2;
      factors.push("Many custom features");
    }
    if (input.website.expectedRevisions === "High") {
      score += 2;
      factors.push("High revisions expected");
    }
    if (input.website.multilingual) {
      score += 1;
      factors.push("Multilingual scope/QA");
    }
  }

  if (input.category === "Marketing" && input.marketing) {
    if (input.marketing.reportingLevel === "Advanced") {
      score += 1;
      factors.push("Advanced reporting");
    }
    if (input.marketing.campaignComplexity === "High") {
      score += 2;
      factors.push("High campaign complexity");
    }
  }

  if (score <= 2) return { riskLevel: "Low", riskFactors: factors };
  if (score <= 5) return { riskLevel: "Moderate", riskFactors: factors };
  return { riskLevel: "High", riskFactors: factors };
}

export function calculateCapacityImpact(estimatedHours: number, freeCapacityHours: number): CapacityImpact {
  if (freeCapacityHours <= 0) return "High";
  const ratio = estimatedHours / freeCapacityHours;
  if (ratio <= 0.35) return "Low";
  if (ratio <= 0.75) return "Medium";
  return "High";
}

export function estimateAll(input: EstimatorInput & { freeCapacityHours: number }): EstimatorResult {
  const h = calculateEstimatedHours(input);
  const timeline = calculateTimelineDays(h.estimatedHours, input.urgency);
  const pricing = calculatePricing(h.estimatedHours, input.category, input.complexity);
  const risk = calculateRiskLevel(input, h.estimatedHours);
  const cap = calculateCapacityImpact(h.estimatedHours, input.freeCapacityHours);

  const eurPerHour = pricing.recommendedPrice > 0 && h.estimatedHours > 0 ? pricing.recommendedPrice / h.estimatedHours : 0;

  return {
    estimatedHours: h.estimatedHours,
    estimatedTimelineDays: timeline,
    internalBaseRate: pricing.internalBaseRate,
    targetRate: pricing.targetRate,
    minimumPrice: pricing.minimumPrice,
    recommendedPrice: pricing.recommendedPrice,
    suggestedRange: pricing.suggestedRange,
    eurPerHour,
    capacityImpact: cap,
    riskLevel: risk.riskLevel,
    drivers: h.drivers,
    expensiveFactors: h.expensiveFactors,
    riskFactors: Array.from(new Set([...(h.riskFactors ?? []), ...(risk.riskFactors ?? [])])),
  };
}

