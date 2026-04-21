import type { ServiceCategory } from "@/lib/services/catalog";

export const WORKLOAD_STATUSES = ["Healthy", "AtRisk", "Overloaded"] as const;
export type WorkloadStatus = (typeof WORKLOAD_STATUSES)[number];

export const PAYMENT_STATUSES = ["Retainer", "Subscription", "Unpaid", "Partial", "Paid"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type CommitmentCategory = "Website" | "Marketing" | "Design";

export type ProjectOrigin = "Manual" | "From Offer";

export type SelectedService = {
  name: string;
  category: ServiceCategory;
};

export type CommitmentProject = {
  id: string;
  offerId?: string | null;
  origin: ProjectOrigin;
  clientName: string;
  companyName: string;
  projectName: string;
  category: CommitmentCategory;
  selectedServices: SelectedService[];
  startDate: string; // ISO (we use YYYY-MM-DDT..Z)
  targetEndDate: string; // ISO
  estimatedHours: number;
  committedHours: number;
  progress: number;
  workloadStatus: WorkloadStatus;
  priceTotal: number;
  currency: string;
  paymentStatus: PaymentStatus;
  invoicedAmount: number;
  paidAmount: number;
  notes: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

