import type {
  BusinessStatus,
  MarketingChecklist,
  Project,
  WebsiteChecklist,
} from "@/lib/projects/types";

export type ChecklistCompletion = {
  done: number;
  total: number;
  percent: number; // 0..100
};

export const WEBSITE_CHECKLIST_ORDER: (keyof WebsiteChecklist)[] = [
  "proposalPrepared",
  "proposalSent",
  "proposalAccepted",
  "contractSent",
  "contractSigned",
  "invoiceSent",
  "invoicePaid",
  "designStarted",
  "designApproved",
  "developmentStarted",
  "developmentCompleted",
  "revisionsRequested",
  "revisionsCompleted",
  "deployed",
];

export const MARKETING_CHECKLIST_ORDER: (keyof MarketingChecklist)[] = [
  "proposalPrepared",
  "proposalSent",
  "proposalAccepted",
  "contractSent",
  "contractSigned",
  "invoiceSent",
  "invoicePaid",
  "strategyDefined",
  "assetsCreated",
  "campaignSetup",
  "campaignLaunched",
  "optimizationOngoing",
  "reporting",
];

export function checklistCompletion(project: Project): ChecklistCompletion {
  const order =
    project.category === "Website" ? WEBSITE_CHECKLIST_ORDER : MARKETING_CHECKLIST_ORDER;
  const checklist = project.checklist as Record<string, boolean>;
  const total = order.length;
  const done = order.reduce((acc, k) => acc + (checklist[String(k)] ? 1 : 0), 0);
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, percent };
}

export function parseIsoDate(input: string): Date {
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? new Date(0) : d;
}

export function formatShortDate(iso: string): string {
  const d = parseIsoDate(iso);
  if (d.getTime() === 0) return "—";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "2-digit" }).format(d);
}

export function daysUntil(iso: string, now = new Date()): number | null {
  const d = parseIsoDate(iso);
  if (d.getTime() === 0) return null;
  const ms = d.getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function isOverdue(project: Project, now = new Date()): boolean {
  if (project.status === "Completed" || project.status === "Cancelled") return false;
  const end = parseIsoDate(project.targetEndDate);
  if (end.getTime() === 0) return false;
  return end.getTime() < now.getTime();
}

export function isBlocked(project: Project): boolean {
  return project.status === "Blocked" || Boolean(project.blockedReason?.trim());
}

export function currentStageLabel(project: Project): string {
  const c = project.checklist as Record<string, boolean>;

  if (project.category === "Website") {
    if (c.deployed) return "Delivered";
    if (c.revisionsRequested && !c.revisionsCompleted) return "In Revisions";
    if (c.developmentStarted && !c.developmentCompleted) return "In Development";
    if (c.developmentCompleted && !c.deployed) return "Ready to Deploy";
    if (c.designStarted && !c.designApproved) return "In Design";
    if (c.designApproved && !c.developmentStarted) return "Ready for Development";
    if (c.contractSigned && !c.designStarted) return "Ready for Design";
  } else {
    if (c.reporting) return "Reporting";
    if (c.optimizationOngoing) return "Optimizing";
    if (c.campaignLaunched) return "Live";
    if (c.campaignSetup && !c.campaignLaunched) return "Ready to Launch";
    if (c.assetsCreated && !c.campaignSetup) return "Ready for Setup";
    if (c.strategyDefined && !c.assetsCreated) return "Assets In Progress";
    if (c.contractSigned && !c.strategyDefined) return "Ready for Strategy";
  }

  if (c.invoiceSent && !c.invoicePaid) return "Waiting for Payment";
  if (c.contractSent && !c.contractSigned) return "Contract Out";
  if (c.proposalSent && !c.proposalAccepted) return "Proposal Out";
  if (c.proposalPrepared && !c.proposalSent) return "Proposal Prep";

  switch (project.status) {
    case "Lead":
      return "Lead Intake";
    case "Proposal Sent":
      return "Proposal Out";
    case "Won":
      return "Sold (Not Scheduled)";
    case "Scheduled":
      return "Queued / Scheduled";
    case "Waiting for Client":
      return "Waiting for Client";
    case "Blocked":
      return "Blocked";
    case "Completed":
      return "Completed";
    case "Cancelled":
      return "Cancelled";
    case "In Progress":
    default:
      return "In Delivery";
  }
}

export type FlowBucket = "sold" | "scheduled" | "active" | "blocked" | "completed" | "other";

export function flowBucket(status: BusinessStatus): FlowBucket {
  if (status === "Scheduled") return "scheduled";
  if (status === "In Progress" || status === "Waiting for Client") return "active";
  if (status === "Blocked") return "blocked";
  if (status === "Completed") return "completed";
  if (status === "Won") return "sold";
  return "other";
}

