/** Ordered business workflow statuses for website/marketing pipeline projects. */
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

/** Supported project category buckets. */
export const PROJECT_CATEGORIES = ["Website", "Marketing"] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

/** Allowed lead/source ownership values. */
export const SOURCE_OWNERS = ["Peter", "Krasi", "Team"] as const;
export type SourceOwner = (typeof SOURCE_OWNERS)[number];

/** Priority levels used for operational planning. */
export const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

/** Canonical project type options across website and marketing work. */
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

/** ISO-8601 timestamp string alias used across project entities. */
export type IsoDateString = string;

/** Checklist schema for website delivery lifecycle. */
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

/** Checklist schema for marketing retainer/campaign lifecycle. */
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

/** Union of checklist schemas for all project categories. */
export type ProjectChecklist = WebsiteChecklist | MarketingChecklist;

/** Activity/note entry attached to a project timeline. */
export type ProjectNote = {
  id: string;
  projectId: string;
  author: string;
  body: string;
  createdAt: IsoDateString;
};

/**
 * Primary website/marketing pipeline project model used in UI/store layer.
 *
 * Includes commercial fields, lifecycle status, checklist state, and activity feed.
 */
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

/** Lightweight filter state used by project list/board UIs. */
export type ProjectFilters = {
  q?: string;
  status?: BusinessStatus | "All";
};

