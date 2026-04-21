import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/db/supabase/server";
import { webProjectFromRow, type DbWebProjectRow } from "@/lib/db/mappers";

export async function GET() {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("web_projects")
    .select("*")
    .eq("is_archived", false)
    .order("start_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const projects = (data as DbWebProjectRow[]).map(webProjectFromRow);
  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const body = (await req.json()) as {
    clientName: string;
    companyName: string;
    projectName: string;
    projectType: string;
    sourceOwner: string;
    status: string;
    priority: string;
    startDate: string; // ISO
    targetEndDate: string; // ISO
    notes?: string;
    blockedReason?: string;
    checklist?: unknown;
    proposalAmount?: number;
    agreedAmount?: number;
    invoicedAmount?: number;
    paidAmount?: number;
    currency?: string;
    paymentStatus?: string;
    services?: unknown;
    isArchived?: boolean;
  };

  const insert = {
    client_name: body.clientName,
    company_name: body.companyName,
    project_name: body.projectName,
    project_type: body.projectType,
    source_owner: body.sourceOwner,
    status: body.status,
    priority: body.priority,
    start_date: body.startDate.slice(0, 10),
    target_end_date: body.targetEndDate.slice(0, 10),
    notes: body.notes ?? "",
    blocked_reason: body.blockedReason ?? null,
    checklist_json: body.checklist ?? {},
    proposal_amount: body.proposalAmount ?? 0,
    agreed_amount: body.agreedAmount ?? 0,
    invoiced_amount: body.invoicedAmount ?? 0,
    paid_amount: body.paidAmount ?? 0,
    currency: body.currency ?? "EUR",
    payment_status: body.paymentStatus ?? "Unpaid",
    is_archived: body.isArchived ?? false,
    services_json: body.services ?? [],
  };

  const { data, error } = await supabase.from("web_projects").insert(insert).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ project: webProjectFromRow(data as DbWebProjectRow) }, { status: 201 });
}

