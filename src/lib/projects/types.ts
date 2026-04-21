export const BUSINESS_STATUSES = [
  "Lead",
  "Proposal Sent",
  "Won",
  "Scheduled",
  "In Progress",
  "Waiting for Client",
  "Blocked",
  "Completed",
  "Cancelled",
] as const;

export type BusinessStatus = (typeof BUSINESS_STATUSES)[number];

export const PROJECT_CATEGORIES = ["Website", "Marketing"] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const SOURCE_OWNERS = ["Peter", "Krasi", "Team"] as const;
export type SourceOwner = (typeof SOURCE_OWNERS)[number];

export const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PROJECT_TYPES = [
  // Websites
  "Landing Page",
  "Corporate Website",
  "E-commerce",
  "Custom Web App",
  // Marketing
  "Facebook Ads",
  "Google Ads",
  "SEO",
  "Social Media Management",
  "Email Marketing",
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export type IsoDateString = string;

export type WebsiteChecklist = {
  proposalPrepared: boolean;
  proposalSent: boolean;
  proposalAccepted: boolean;
  contractSent: boolean;
  contractSigned: boolean;
  invoiceSent: boolean;
  invoicePaid: boolean;
  designStarted: boolean;
  designApproved: boolean;
  developmentStarted: boolean;
  developmentCompleted: boolean;
  revisionsRequested: boolean;
  revisionsCompleted: boolean;
  deployed: boolean;
};

export type MarketingChecklist = {
  proposalPrepared: boolean;
  proposalSent: boolean;
  proposalAccepted: boolean;
  contractSent: boolean;
  contractSigned: boolean;
  invoiceSent: boolean;
  invoicePaid: boolean;
  strategyDefined: boolean;
  assetsCreated: boolean;
  campaignSetup: boolean;
  campaignLaunched: boolean;
  optimizationOngoing: boolean;
  reporting: boolean;
};

export type ProjectChecklist = WebsiteChecklist | MarketingChecklist;

export type ProjectNote = {
  id: string;
  projectId: string;
  author: string;
  body: string;
  createdAt: IsoDateString;
};

export type Project = {
  id: string;
  category: ProjectCategory;
  clientName: string;
  companyName: string;
  projectName: string;
  projectType: ProjectType;
  services: {
    name: string;
    category: "Web" | "Marketing" | "Design";
  }[];
  sourceOwner: SourceOwner;
  status: BusinessStatus;
  sortIndex?: number;
  startDate: IsoDateString;
  targetEndDate: IsoDateString;
  priority: Priority;
  notes: string;
  isArchived: boolean;
  proposalAmount: number;
  agreedAmount: number;
  invoicedAmount: number;
  paidAmount: number;
  currency: string;
  paymentStatus: "Unpaid" | "Partial" | "Paid";
  blockedReason?: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
  checklist: ProjectChecklist;
  activity: ProjectNote[];
};

export type ProjectFilters = {
  q?: string;
  status?: BusinessStatus | "All";
};

