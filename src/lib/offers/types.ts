import type { ServiceCategory } from "@/lib/services/catalog";

export const OFFER_CATEGORIES = ["Website", "Marketing", "Design"] as const;
export type OfferCategory = (typeof OFFER_CATEGORIES)[number];

export const OFFER_COMPLEXITIES = ["Low", "Medium", "High", "Preliminary", "Custom"] as const;
export type OfferComplexity = (typeof OFFER_COMPLEXITIES)[number];

export const OFFER_STATUSES = ["Draft", "Sent", "Accepted"] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];

export type SelectedService = {
  name: string;
  category: ServiceCategory;
};

export type WorkloadByDepartment = Record<string, number>;

export type Offer = {
  id: string;
  clientName: string;
  companyName: string;
  projectName: string;
  category: OfferCategory;
  complexity: OfferComplexity;
  notes: string;
  selectedServices: SelectedService[];
  estimatedHours: number;
  estimatedTimelineDays: number;
  suggestedPrice: number;
  currency: string;
  workloadByDepartment: WorkloadByDepartment;
  status: OfferStatus;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

