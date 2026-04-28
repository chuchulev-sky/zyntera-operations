import type { ServiceCategory } from "@/lib/services/catalog";

/** Supported high-level estimator categories. */
export type EstimatorCategory = "Website" | "Marketing" | "Design";
/** Complexity levels used by estimator multipliers. */
export type EstimatorComplexity = "Low" | "Medium" | "High" | "Custom";
/** Delivery urgency levels used for timeline and effort adjustments. */
export type EstimatorUrgency = "Normal" | "Fast" | "Urgent";

/** Website project archetypes used for scope baselines. */
export type WebsiteType = "Landing Page" | "Corporate Website" | "E-commerce" | "Custom Web App";
/** Revision expectation band used for extra effort/risk. */
export type ExpectedRevisions = "Low" | "Medium" | "High";

/** Marketing channels selectable in estimator marketing mode. */
export type MarketingChannel = "Facebook Ads" | "Google Ads" | "SEO" | "Social Media Management" | "Email Marketing";
/** Reporting depth level for retainers/campaigns. */
export type ReportingLevel = "Basic" | "Standard" | "Advanced";
/** Campaign complexity tier for marketing estimation. */
export type CampaignComplexity = "Low" | "Medium" | "High";

/** Relative impact of work on currently free team capacity. */
export type CapacityImpact = "Low" | "Medium" | "High";
/** Overall delivery risk level produced by estimator scoring. */
export type RiskLevel = "Low" | "Moderate" | "High";

/**
 * Service line item selected in estimator.
 *
 * @property name Human-readable service name.
 * @property category Service category bucket.
 */
export type EstimatorService = {
  name: string;
  category: ServiceCategory;
};

/**
 * Full estimator input payload.
 *
 * Includes common project fields plus category-specific sub-sections
 * for Website/Design and Marketing scenarios.
 */
export type EstimatorInput = {
  clientName: string;
  projectName: string;
  category: EstimatorCategory;
  selectedServices: EstimatorService[];
  complexity: EstimatorComplexity;
  urgency: EstimatorUrgency;
  notes: string;

  website?: {
    websiteType: WebsiteType;
    pageCount: number;
    multilingual: boolean;
    cmsRequired: boolean;
    customFeatures: string[];
    contentReady: boolean;
    seoSetupIncluded: boolean;
    uiuxIncluded: boolean;
    brandingIncluded: boolean;
    expectedRevisions: ExpectedRevisions;
  };

  marketing?: {
    channels: MarketingChannel[];
    creativesPerMonth: number;
    reportingLevel: ReportingLevel;
    landingPageSupport: boolean;
    campaignComplexity: CampaignComplexity;
  };
};

/**
 * Full estimator output payload returned by `estimateAll`.
 *
 * Combines effort, timeline, pricing, capacity, risk, and explanatory factors.
 */
export type EstimatorResult = {
  estimatedHours: number;
  estimatedTimelineDays: number;
  internalBaseRate: number;
  targetRate: number;
  minimumPrice: number;
  recommendedPrice: number;
  suggestedRange: { min: number; max: number };
  eurPerHour: number;
  capacityImpact: CapacityImpact;
  riskLevel: RiskLevel;
  drivers: string[];
  expensiveFactors: string[];
  riskFactors: string[];
};

