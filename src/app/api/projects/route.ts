import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/db/supabase/server";
import { commitmentProjectFromRow, type DbCommitmentProjectRow } from "@/lib/db/mappers";
import type { CommitmentProject } from "@/lib/commitments/types";
import { normalizeCompanyName } from "@/lib/companies/normalize";

export async function GET() {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("commitment_projects")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const projects = ((data as DbCommitmentProjectRow[]) ?? []).map(commitmentProjectFromRow);
  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const body = (await req.json()) as Partial<CommitmentProject>;

  const paymentStatus = String(body.paymentStatus ?? "Unpaid").trim();

  const startDateIso = typeof body.startDate === "string" && body.startDate.trim() ? body.startDate : new Date().toISOString();
  const targetEndDateIso =
    typeof body.targetEndDate === "string" && body.targetEndDate.trim() ? body.targetEndDate : new Date().toISOString();

  const insert = {
    offer_id: body.offerId ?? null,
    origin: body.origin ?? "Manual",
    client_name: String(body.clientName ?? "").trim(),
    company_name: normalizeCompanyName(String(body.companyName ?? "")),
    project_name: String(body.projectName ?? "").trim(),
    category: body.category ?? "Website",
    selected_services_json: Array.isArray(body.selectedServices) ? body.selectedServices : [],
    start_date: startDateIso.slice(0, 10),
    target_end_date: targetEndDateIso.slice(0, 10),
    estimated_hours_total: typeof body.estimatedHours === "number" ? body.estimatedHours : 0,
    committed_hours_total: typeof body.committedHours === "number" ? body.committedHours : 0,
    progress: typeof body.progress === "number" ? body.progress : 0,
    workload_status: body.workloadStatus ?? "Healthy",
    price_total: typeof body.priceTotal === "number" ? body.priceTotal : 0,
    currency: body.currency ?? "EUR",
    payment_status: paymentStatus,
    invoiced_amount: typeof body.invoicedAmount === "number" ? body.invoicedAmount : 0,
    paid_amount: typeof body.paidAmount === "number" ? body.paidAmount : 0,
    notes: String(body.notes ?? ""),
    is_archived: false,
  };

  if (!insert.client_name || !insert.company_name || !insert.project_name) {
    return NextResponse.json({ error: "clientName, companyName, projectName are required" }, { status: 400 });
  }

  // Ensure a company profile exists (best-effort).
  {
    const name = insert.company_name;
    if (name) {
      const existing = await supabase.from("companies").select("id").eq("name", name).maybeSingle();
      if (!existing.error && !existing.data) {
        await supabase.from("companies").insert({
          name,
          notes: "",
          tags: [],
          website: "",
          linkedin: "",
          billing_email: "",
          billing_address: "",
          vat_number: "",
          contacts_json: [],
        });
      }
    }
  }

  // Try with `origin` (new schema). If the DB hasn't been migrated yet, retry without it.
  let data: unknown = null;
  let error: { message: string } | null = null;

  {
    const res = await supabase.from("commitment_projects").insert(insert).select("*").single();
    data = res.data;
    error = (res.error as any) ?? null;
  }

  if (error) {
    const msg = String(error.message ?? "");
    const originColumnMissing =
      msg.toLowerCase().includes("origin") && (msg.toLowerCase().includes("column") || msg.toLowerCase().includes("schema cache"));

    if (originColumnMissing) {
      const { origin: _origin, ...withoutOrigin } = insert as any;
      const res2 = await supabase.from("commitment_projects").insert(withoutOrigin).select("*").single();
      data = res2.data;
      error = (res2.error as any) ?? null;
    }
  }

  if (error) {
    const msg = String(error.message ?? "");
    const scheduleColumnMissing =
      (msg.toLowerCase().includes("start_date") || msg.toLowerCase().includes("target_end_date")) &&
      (msg.toLowerCase().includes("column") || msg.toLowerCase().includes("schema cache"));

    if (scheduleColumnMissing) {
      const { start_date: _sd, target_end_date: _ed, ...withoutSchedule } = insert as any;
      const res3 = await supabase.from("commitment_projects").insert(withoutSchedule).select("*").single();
      data = res3.data;
      error = (res3.error as any) ?? null;
    }
  }

  if (error) {
    const msg = String(error.message ?? "");
    const paymentStatusConstraint =
      msg.includes("commitment_projects_payment_status_check") ||
      msg.toLowerCase().includes("payment_status_check") ||
      msg.toLowerCase().includes("payment_status");

    return NextResponse.json(
      {
        error: `${error.message} (attempted payment_status=${insert.payment_status})`,
        code: (error as any).code,
        details: (error as any).details,
        hint: (error as any).hint,
        attempted: { payment_status: insert.payment_status },
        actionable: paymentStatusConstraint
          ? "DB constraint is rejecting this payment_status. Ensure the constraint in the active Supabase project/environment allows Retainer/Subscription."
          : undefined,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ project: commitmentProjectFromRow(data as DbCommitmentProjectRow) }, { status: 201 });
}

