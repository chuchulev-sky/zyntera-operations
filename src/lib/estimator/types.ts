import type { ServiceCategory } from "@/lib/services/catalog";

export type EstimatorCategory = "Website" | "Marketing" | "Design";
export type EstimatorComplexity = "Low" | "Medium" | "High" | "Custom";
export type EstimatorUrgency = "Normal" | "Fast" | "Urgent";

export type WebsiteType = "Landing Page" | "Corporate Website" | "E-commerce" | "Custom Web App";
export type ExpectedRevisions = "Low" | "Medium" | "High";

export type MarketingChannel = "Facebook Ads" | "Google Ads" | "SEO" | "Social Media Management" | "Email Marketing";
export type ReportingLevel = "Basic" | "Standard" | "Advanced";
export type CampaignComplexity = "Low" | "Medium" | "High";

export type CapacityImpact = "Low" | "Medium" | "High";
export type RiskLevel = "Low" | "Moderate" | "High";

export type EstimatorService = {
  name: string;
  category: ServiceCategory;
};

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

