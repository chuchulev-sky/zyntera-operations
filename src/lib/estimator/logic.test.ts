import { describe, expect, it } from "vitest";
import {
  calculateCapacityImpact,
  calculateEstimatedHours,
  calculatePricing,
  calculateRiskLevel,
  calculateTimelineDays,
  estimateAll,
  INTERNAL_BASE_RATE_EUR,
  TARGET_RATE_EUR,
} from "@/lib/estimator/logic";
import type { EstimatorInput } from "@/lib/estimator/types";

function baseInput(overrides?: Partial<EstimatorInput>): EstimatorInput {
  return {
    clientName: "Test Client",
    projectName: "Test Project",
    category: "Website",
    selectedServices: [{ name: "Website Development", category: "Web" }],
    complexity: "Medium",
    urgency: "Normal",
    notes: "",
    website: {
      websiteType: "Corporate Website",
      pageCount: 6,
      multilingual: false,
      cmsRequired: true,
      customFeatures: [],
      contentReady: false,
      seoSetupIncluded: true,
      uiuxIncluded: false,
      brandingIncluded: false,
      expectedRevisions: "Medium",
    },
    ...overrides,
  };
}

describe("estimator logic", () => {
  it("computes expected website hours for a common corporate website scenario", () => {
    const out = calculateEstimatedHours(baseInput());
    // 90 base +1 extra page +8 cms +8 content-not-ready +4 seo +8 medium revisions = 119
    expect(out.estimatedHours).toBe(119);
    expect(out.drivers).toContain("Website type: Corporate Website");
    expect(out.expensiveFactors).toContain("CMS required");
    expect(out.riskFactors).toContain("Content not ready");
  });

  it("applies website clamp bounds after multipliers", () => {
    const out = calculateEstimatedHours(
      baseInput({
        complexity: "Custom",
        urgency: "Urgent",
        website: {
          websiteType: "Landing Page",
          pageCount: 40,
          multilingual: true,
          cmsRequired: true,
          customFeatures: ["A", "B", "C", "D"],
          contentReady: false,
          seoSetupIncluded: true,
          uiuxIncluded: true,
          brandingIncluded: true,
          expectedRevisions: "High",
        },
      })
    );
    // Landing page is clamped to max 40 even when inflated.
    expect(out.estimatedHours).toBe(40);
  });

  it("defaults design sizing to medium when website context is missing", () => {
    const out = calculateEstimatedHours(
      baseInput({
        category: "Design",
        website: undefined,
      })
    );
    expect(out.estimatedHours).toBe(30);
    expect(out.drivers).toContain("Design size: Medium");
  });

  it("computes marketing hours from tier, channels, creatives, and landing page support", () => {
    const out = calculateEstimatedHours({
      clientName: "MKT",
      projectName: "Retainer",
      category: "Marketing",
      selectedServices: [{ name: "SEO", category: "Marketing" }],
      complexity: "Medium",
      urgency: "Normal",
      notes: "",
      marketing: {
        channels: ["Facebook Ads", "Google Ads", "SEO"],
        creativesPerMonth: 10,
        reportingLevel: "Advanced",
        landingPageSupport: true,
        campaignComplexity: "High",
      },
    });
    // 60 (advanced tier) + 9 (3 channels * 3h) + 3 (10 * 0.3h) + 6 support = 78
    expect(out.estimatedHours).toBe(78);
    expect(out.drivers).toContain("Marketing tier: Advanced");
  });

  it("calculates timeline based on urgency throughput", () => {
    expect(calculateTimelineDays(60, "Normal")).toBe(14);
    expect(calculateTimelineDays(60, "Fast")).toBe(12);
    expect(calculateTimelineDays(60, "Urgent")).toBe(10);
  });

  it("calculates pricing from internal and target rates", () => {
    const pricing = calculatePricing(100, "Website", "Medium");
    expect(pricing.internalBaseRate).toBe(INTERNAL_BASE_RATE_EUR);
    expect(pricing.targetRate).toBe(TARGET_RATE_EUR);
    expect(pricing.minimumPrice).toBe(1800);
    expect(pricing.recommendedPrice).toBe(3850);
    expect(pricing.suggestedRange).toEqual({ min: 1800, max: 3850 });
  });

  it("assigns high risk for high-complexity high-urgency large website scope", () => {
    const risk = calculateRiskLevel(
      baseInput({
        complexity: "Custom",
        urgency: "Urgent",
        website: {
          websiteType: "Custom Web App",
          pageCount: 12,
          multilingual: true,
          cmsRequired: true,
          customFeatures: ["Auth", "Payments", "Integrations", "Analytics"],
          contentReady: false,
          seoSetupIncluded: true,
          uiuxIncluded: true,
          brandingIncluded: false,
          expectedRevisions: "High",
        },
      }),
      260
    );
    expect(risk.riskLevel).toBe("High");
    expect(risk.riskFactors).toContain("Content not ready");
    expect(risk.riskFactors).toContain("Many custom features");
  });

  it("classifies capacity impact by ratio thresholds", () => {
    expect(calculateCapacityImpact(10, 40)).toBe("Low"); // 0.25
    expect(calculateCapacityImpact(20, 40)).toBe("Medium"); // 0.5
    expect(calculateCapacityImpact(35, 40)).toBe("High"); // 0.875
    expect(calculateCapacityImpact(10, 0)).toBe("High");
  });

  it("estimateAll returns coherent combined output", () => {
    const out = estimateAll({
      ...baseInput(),
      freeCapacityHours: 160,
    });

    expect(out.estimatedHours).toBeGreaterThan(0);
    expect(out.estimatedTimelineDays).toBeGreaterThanOrEqual(3);
    expect(out.minimumPrice).toBeLessThanOrEqual(out.recommendedPrice);
    expect(out.eurPerHour).toBeGreaterThan(0);
    expect(["Low", "Medium", "High"]).toContain(out.capacityImpact);
    expect(["Low", "Moderate", "High"]).toContain(out.riskLevel);
    // dedupe behavior
    expect(new Set(out.riskFactors).size).toBe(out.riskFactors.length);
  });
});
