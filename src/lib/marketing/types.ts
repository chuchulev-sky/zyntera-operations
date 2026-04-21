export const MARKETING_SERVICES = [
  "Facebook Ads",
  "Google Ads",
  "SEO",
  "Social Media Management",
  "Email Marketing",
] as const;

export type MarketingService = (typeof MARKETING_SERVICES)[number];

export const MARKETING_CLIENT_STATUSES = ["Active", "Paused"] as const;
export type MarketingClientStatus = (typeof MARKETING_CLIENT_STATUSES)[number];

export const MONTHLY_PAYMENT_STATUSES = ["Paid", "Unpaid", "Late"] as const;
export type MonthlyPaymentStatus = (typeof MONTHLY_PAYMENT_STATUSES)[number];

export type MonthKey = string; // "YYYY-MM"

export type MonthlyRecord = {
  month: MonthKey;
  paid: boolean;
  paymentStatus: MonthlyPaymentStatus;
  notes?: string;
  paidAt?: string; // ISO
};

export type MarketingClient = {
  id: string;
  clientName: string;
  services: MarketingService[];
  monthlyFee: number; // gross
  netAmount: number;
  creativesPerMonth: number;
  owner: "Peter" | "Krasi" | "Team";
  status: MarketingClientStatus;
  records: MonthlyRecord[];
  createdAt: string;
  updatedAt: string;
};

