import type { MarketingClient, MonthlyRecord } from "@/lib/marketing/types";
import type { Project, WebsiteChecklist } from "@/lib/projects/types";
import type { Offer } from "@/lib/offers/types";
import type { CommitmentProject } from "@/lib/commitments/types";
import type { Company, CompanyContact } from "@/lib/companies/types";

export type DbWebProjectRow = {
  id: string;
  client_name: string;
  company_name: string;
  project_name: string;
  project_type: string;
  services_json?: unknown;
  source_owner: string;
  status: string;
  priority: string;
  start_date: string; // YYYY-MM-DD
  target_end_date: string; // YYYY-MM-DD
  notes: string | null;
  blocked_reason: string | null;
  is_archived?: boolean;
  checklist_json: unknown;
  proposal_amount: string | number | null;
  agreed_amount: string | number | null;
  invoiced_amount: string | number | null;
  paid_amount: string | number | null;
  currency: string | null;
  payment_status: string | null;
  sort_index: number | null;
  created_at: string;
  updated_at: string;
};

export type DbWebProjectNoteRow = {
  id: string;
  project_id: string;
  author: string;
  body: string;
  created_at: string;
};

export type DbMarketingClientRow = {
  id: string;
  client_name: string;
  services: string[] | null;
  monthly_fee: string | number | null;
  net_amount: string | number | null;
  creatives_per_month: number | null;
  owner: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
};

export type DbMarketingMonthlyRecordRow = {
  id: string;
  client_id: string;
  month_key: string;
  paid: boolean;
  payment_status: string;
  notes: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DbOfferRow = {
  id: string;
  client_name: string;
  company_name: string;
  project_name: string;
  category: string;
  complexity: string;
  notes: string | null;
  selected_services_json: unknown;
  estimated_hours_total: string | number | null;
  estimated_timeline_days: number | null;
  suggested_price: string | number | null;
  currency: string | null;
  workload_by_department_json: unknown;
  status: string | null;
  is_archived: boolean | null;
  created_at: string;
  updated_at: string;
};

export type DbCommitmentProjectRow = {
  id: string;
  offer_id: string | null;
  origin?: string | null;
  client_name: string;
  company_name: string;
  project_name: string;
  category: string;
  selected_services_json: unknown;
  owner: string | null;
  start_date?: string | null; // YYYY-MM-DD (optional during rollout)
  target_end_date?: string | null; // YYYY-MM-DD (optional during rollout)
  estimated_hours_total: string | number | null;
  committed_hours_total: string | number | null;
  progress: number | null;
  workload_status: string | null;
  price_total: string | number | null;
  currency: string | null;
  payment_status: string | null;
  invoiced_amount: string | number | null;
  paid_amount: string | number | null;
  notes: string | null;
  is_archived: boolean | null;
  created_at: string;
  updated_at: string;
};

export type DbCompanyRow = {
  id: string;
  name: string;
  notes: string | null;
  tags: string[] | null;
  website: string | null;
  linkedin: string | null;
  billing_email: string | null;
  billing_address: string | null;
  vat_number: string | null;
  contacts_json: unknown;
  created_at: string;
  updated_at: string;
};

function num(v: string | number | null | undefined): number {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim()) return Number(v);
  return 0;
}

function isServiceCategory(v: unknown): v is "Web" | "Marketing" | "Design" {
  return v === "Web" || v === "Marketing" || v === "Design";
}

function parseServicesJson(v: unknown, fallbackProjectType: string): Project["services"] {
  if (Array.isArray(v)) {
    const out: Project["services"] = [];
    for (const item of v) {
      if (!item || typeof item !== "object") continue;
      const rec = item as Record<string, unknown>;
      const name = typeof rec.name === "string" ? rec.name : "";
      const cat = isServiceCategory(rec.category) ? rec.category : "Web";
      if (name.trim()) out.push({ name, category: cat });
    }
    if (out.length) return out;
  }

  return [
    {
      name: fallbackProjectType,
      category:
        fallbackProjectType === "Facebook Ads" ||
        fallbackProjectType === "Google Ads" ||
        fallbackProjectType === "SEO" ||
        fallbackProjectType === "Social Media Management" ||
        fallbackProjectType === "Email Marketing"
          ? "Marketing"
          : "Web",
    },
  ];
}

export function webProjectFromRow(row: DbWebProjectRow): Project {
  const checklist = (row.checklist_json ?? {}) as Partial<WebsiteChecklist>;
  const mappedServices = parseServicesJson(row.services_json, row.project_type);
  return {
    id: row.id,
    category: "Website",
    clientName: row.client_name,
    companyName: row.company_name,
    projectName: row.project_name,
    projectType: row.project_type as Project["projectType"],
    services: mappedServices,
    sourceOwner: (row.source_owner as Project["sourceOwner"]) ?? "Team",
    status: row.status as Project["status"],
    sortIndex: row.sort_index ?? undefined,
    startDate: new Date(`${row.start_date}T09:00:00`).toISOString(),
    targetEndDate: new Date(`${row.target_end_date}T09:00:00`).toISOString(),
    priority: row.priority as Project["priority"],
    notes: row.notes ?? "",
    isArchived: Boolean(row.is_archived),
    blockedReason: row.blocked_reason ?? undefined,
    proposalAmount: num(row.proposal_amount),
    agreedAmount: num(row.agreed_amount),
    invoicedAmount: num(row.invoiced_amount),
    paidAmount: num(row.paid_amount),
    currency: row.currency ?? "EUR",
    paymentStatus: (row.payment_status as Project["paymentStatus"]) ?? "Unpaid",
    checklist: {
      proposalPrepared: Boolean(checklist.proposalPrepared),
      proposalSent: Boolean(checklist.proposalSent),
      proposalAccepted: Boolean(checklist.proposalAccepted),
      contractSent: Boolean(checklist.contractSent),
      contractSigned: Boolean(checklist.contractSigned),
      invoiceSent: Boolean(checklist.invoiceSent),
      invoicePaid: Boolean(checklist.invoicePaid),
      designStarted: Boolean(checklist.designStarted),
      designApproved: Boolean(checklist.designApproved),
      developmentStarted: Boolean(checklist.developmentStarted),
      developmentCompleted: Boolean(checklist.developmentCompleted),
      revisionsRequested: Boolean(checklist.revisionsRequested),
      revisionsCompleted: Boolean(checklist.revisionsCompleted),
      deployed: Boolean(checklist.deployed),
    },
    activity: [], // hydrated separately
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function webProjectPatchToRow(patch: Partial<Project>) {
  const out: Record<string, unknown> = {};
  if (patch.clientName !== undefined) out.client_name = patch.clientName;
  if (patch.companyName !== undefined) out.company_name = patch.companyName;
  if (patch.projectName !== undefined) out.project_name = patch.projectName;
  if (patch.projectType !== undefined) out.project_type = patch.projectType;
  if (patch.sourceOwner !== undefined) out.source_owner = patch.sourceOwner;
  if (patch.status !== undefined) out.status = patch.status;
  if (patch.priority !== undefined) out.priority = patch.priority;
  if (patch.notes !== undefined) out.notes = patch.notes;
  if (patch.blockedReason !== undefined) out.blocked_reason = patch.blockedReason;
  if (patch.sortIndex !== undefined) out.sort_index = patch.sortIndex;

  if (patch.startDate !== undefined) out.start_date = patch.startDate.slice(0, 10);
  if (patch.targetEndDate !== undefined) out.target_end_date = patch.targetEndDate.slice(0, 10);

  if (patch.proposalAmount !== undefined) out.proposal_amount = patch.proposalAmount;
  if (patch.agreedAmount !== undefined) out.agreed_amount = patch.agreedAmount;
  if (patch.invoicedAmount !== undefined) out.invoiced_amount = patch.invoicedAmount;
  if (patch.paidAmount !== undefined) out.paid_amount = patch.paidAmount;
  if (patch.currency !== undefined) out.currency = patch.currency;
  if (patch.paymentStatus !== undefined) out.payment_status = patch.paymentStatus;
  if (patch.isArchived !== undefined) out.is_archived = patch.isArchived;

  if (patch.checklist !== undefined) out.checklist_json = patch.checklist;
  if (patch.services !== undefined) out.services_json = patch.services;

  return out;
}

export function marketingClientFromRows(client: DbMarketingClientRow, records: DbMarketingMonthlyRecordRow[]): MarketingClient {
  return {
    id: client.id,
    clientName: client.client_name,
    services: (client.services ?? []) as MarketingClient["services"],
    monthlyFee: num(client.monthly_fee),
    netAmount: num(client.net_amount),
    creativesPerMonth: client.creatives_per_month ?? 0,
    owner: (client.owner as MarketingClient["owner"]) ?? "Team",
    status: (client.status as MarketingClient["status"]) ?? "Active",
    records: records.map(monthlyRecordFromRow),
    createdAt: client.created_at,
    updatedAt: client.updated_at,
  };
}

export function monthlyRecordFromRow(r: DbMarketingMonthlyRecordRow): MonthlyRecord {
  return {
    month: r.month_key,
    paid: r.paid,
    paymentStatus: r.payment_status as MonthlyRecord["paymentStatus"],
    notes: r.notes ?? "",
    paidAt: r.paid_at ?? undefined,
  };
}

function parseWorkloadByDepartment(v: unknown): Offer["workloadByDepartment"] {
  if (!v || typeof v !== "object") return {};
  const rec = v as Record<string, unknown>;
  const out: Record<string, number> = {};
  for (const [k, val] of Object.entries(rec)) {
    if (typeof val === "number") out[k] = val;
    else if (typeof val === "string" && val.trim() && !Number.isNaN(Number(val))) out[k] = Number(val);
  }
  return out;
}

function parseSelectedServices(v: unknown): Offer["selectedServices"] {
  if (!Array.isArray(v)) return [];
  const out: Offer["selectedServices"] = [];
  for (const item of v) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const name = typeof rec.name === "string" ? rec.name.trim() : "";
    const cat = rec.category === "Web" || rec.category === "Design" || rec.category === "Marketing" ? rec.category : "Web";
    if (name) out.push({ name, category: cat });
  }
  return out;
}

function parseCompanyContacts(v: unknown): CompanyContact[] {
  if (!Array.isArray(v)) return [];
  const out: CompanyContact[] = [];
  for (const item of v) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const name = typeof rec.name === "string" ? rec.name.trim() : "";
    if (!name) continue;
    const role = typeof rec.role === "string" ? rec.role.trim() : undefined;
    const email = typeof rec.email === "string" ? rec.email.trim() : undefined;
    const phone = typeof rec.phone === "string" ? rec.phone.trim() : undefined;
    out.push({ name, role: role || undefined, email: email || undefined, phone: phone || undefined });
  }
  return out;
}

export function companyFromRow(row: DbCompanyRow): Company {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes ?? "",
    tags: (row.tags ?? []) as string[],
    website: row.website ?? "",
    linkedin: row.linkedin ?? "",
    billingEmail: row.billing_email ?? "",
    billingAddress: row.billing_address ?? "",
    vatNumber: row.vat_number ?? "",
    contacts: parseCompanyContacts(row.contacts_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function companyPatchToRow(patch: Partial<Company>) {
  const out: Record<string, unknown> = {};
  if (patch.name !== undefined) out.name = patch.name;
  if (patch.notes !== undefined) out.notes = patch.notes;
  if (patch.tags !== undefined) out.tags = patch.tags;
  if (patch.website !== undefined) out.website = patch.website;
  if (patch.linkedin !== undefined) out.linkedin = patch.linkedin;
  if (patch.billingEmail !== undefined) out.billing_email = patch.billingEmail;
  if (patch.billingAddress !== undefined) out.billing_address = patch.billingAddress;
  if (patch.vatNumber !== undefined) out.vat_number = patch.vatNumber;
  if (patch.contacts !== undefined) out.contacts_json = patch.contacts;
  return out;
}

export function offerFromRow(row: DbOfferRow): Offer {
  return {
    id: row.id,
    clientName: row.client_name,
    companyName: row.company_name,
    projectName: row.project_name,
    category: (row.category as Offer["category"]) ?? "Website",
    complexity: (row.complexity as Offer["complexity"]) ?? "Medium",
    notes: row.notes ?? "",
    selectedServices: parseSelectedServices(row.selected_services_json),
    estimatedHours: num(row.estimated_hours_total),
    estimatedTimelineDays: row.estimated_timeline_days ?? 0,
    suggestedPrice: num(row.suggested_price),
    currency: row.currency ?? "EUR",
    workloadByDepartment: parseWorkloadByDepartment(row.workload_by_department_json),
    status: (row.status as Offer["status"]) ?? "Draft",
    isArchived: Boolean(row.is_archived),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function offerPatchToRow(patch: Partial<Offer>) {
  const out: Record<string, unknown> = {};
  if (patch.clientName !== undefined) out.client_name = patch.clientName;
  if (patch.companyName !== undefined) out.company_name = patch.companyName;
  if (patch.projectName !== undefined) out.project_name = patch.projectName;
  if (patch.category !== undefined) out.category = patch.category;
  if (patch.complexity !== undefined) out.complexity = patch.complexity;
  if (patch.notes !== undefined) out.notes = patch.notes;
  if (patch.selectedServices !== undefined) out.selected_services_json = patch.selectedServices;
  if (patch.estimatedHours !== undefined) out.estimated_hours_total = patch.estimatedHours;
  if (patch.estimatedTimelineDays !== undefined) out.estimated_timeline_days = patch.estimatedTimelineDays;
  if (patch.suggestedPrice !== undefined) out.suggested_price = patch.suggestedPrice;
  if (patch.currency !== undefined) out.currency = patch.currency;
  if (patch.workloadByDepartment !== undefined) out.workload_by_department_json = patch.workloadByDepartment;
  if (patch.status !== undefined) out.status = patch.status;
  if (patch.isArchived !== undefined) out.is_archived = patch.isArchived;
  return out;
}

export function commitmentProjectFromRow(row: DbCommitmentProjectRow): CommitmentProject {
  return {
    id: row.id,
    offerId: row.offer_id,
    origin: (row.origin as CommitmentProject["origin"]) ?? (row.offer_id ? "From Offer" : "Manual"),
    clientName: row.client_name,
    companyName: row.company_name,
    projectName: row.project_name,
    category: (row.category as CommitmentProject["category"]) ?? "Website",
    selectedServices: parseSelectedServices(row.selected_services_json),
    startDate: row.start_date ? new Date(`${row.start_date}T09:00:00`).toISOString() : new Date().toISOString(),
    targetEndDate: row.target_end_date ? new Date(`${row.target_end_date}T09:00:00`).toISOString() : new Date().toISOString(),
    estimatedHours: num(row.estimated_hours_total),
    committedHours: num(row.committed_hours_total),
    progress: row.progress ?? 0,
    workloadStatus: (row.workload_status as CommitmentProject["workloadStatus"]) ?? "Healthy",
    priceTotal: num(row.price_total),
    currency: row.currency ?? "EUR",
    paymentStatus: (row.payment_status as CommitmentProject["paymentStatus"]) ?? "Unpaid",
    invoicedAmount: num(row.invoiced_amount),
    paidAmount: num(row.paid_amount),
    notes: row.notes ?? "",
    isArchived: Boolean(row.is_archived),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function commitmentProjectPatchToRow(patch: Partial<CommitmentProject>) {
  const out: Record<string, unknown> = {};
  if (patch.offerId !== undefined) out.offer_id = patch.offerId;
  if (patch.origin !== undefined) out.origin = patch.origin;
  if (patch.clientName !== undefined) out.client_name = patch.clientName;
  if (patch.companyName !== undefined) out.company_name = patch.companyName;
  if (patch.projectName !== undefined) out.project_name = patch.projectName;
  if (patch.category !== undefined) out.category = patch.category;
  if (patch.selectedServices !== undefined) out.selected_services_json = patch.selectedServices;
  if (patch.startDate !== undefined) out.start_date = patch.startDate.slice(0, 10);
  if (patch.targetEndDate !== undefined) out.target_end_date = patch.targetEndDate.slice(0, 10);
  if (patch.estimatedHours !== undefined) out.estimated_hours_total = patch.estimatedHours;
  if (patch.committedHours !== undefined) out.committed_hours_total = patch.committedHours;
  if (patch.progress !== undefined) out.progress = patch.progress;
  if (patch.workloadStatus !== undefined) out.workload_status = patch.workloadStatus;
  if (patch.priceTotal !== undefined) out.price_total = patch.priceTotal;
  if (patch.currency !== undefined) out.currency = patch.currency;
  if (patch.paymentStatus !== undefined) out.payment_status = patch.paymentStatus;
  if (patch.invoicedAmount !== undefined) out.invoiced_amount = patch.invoicedAmount;
  if (patch.paidAmount !== undefined) out.paid_amount = patch.paidAmount;
  if (patch.notes !== undefined) out.notes = patch.notes;
  if (patch.isArchived !== undefined) out.is_archived = patch.isArchived;
  return out;
}

