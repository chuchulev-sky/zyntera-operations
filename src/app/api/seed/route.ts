import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/db/supabase/server";
import { SEED_PROJECTS } from "@/lib/projects/seed";
import { SEED_MARKETING_CLIENTS } from "@/lib/marketing/seed";

export async function POST() {
  const supabase = supabaseServer();

  // Supabase JS returns count in separate field; easiest: do a small select.
  const { data: webExisting, error: eWebExisting } = await supabase
    .from("web_projects")
    .select("id")
    .limit(1);
  if (eWebExisting) return NextResponse.json({ error: eWebExisting.message }, { status: 500 });

  if ((webExisting ?? []).length === 0) {
    const inserts = SEED_PROJECTS.filter((p) => p.category === "Website").map((p) => ({
      client_name: p.clientName,
      company_name: p.companyName,
      project_name: p.projectName,
      project_type: p.projectType,
      source_owner: p.sourceOwner,
      status: p.status,
      priority: p.priority,
      start_date: p.startDate.slice(0, 10),
      target_end_date: p.targetEndDate.slice(0, 10),
      notes: p.notes,
      blocked_reason: p.blockedReason ?? null,
      checklist_json: p.checklist,
      services_json: p.services,
      is_archived: p.isArchived,
      proposal_amount: p.proposalAmount,
      agreed_amount: p.agreedAmount,
      invoiced_amount: p.invoicedAmount,
      paid_amount: p.paidAmount,
      currency: p.currency,
      payment_status: p.paymentStatus,
      sort_index: p.sortIndex ?? null,
    }));
    const { error } = await supabase.from("web_projects").insert(inserts);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Marketing retainers
  const { data: mktExisting, error: eMktExisting } = await supabase
    .from("marketing_clients")
    .select("id")
    .limit(1);
  if (eMktExisting) return NextResponse.json({ error: eMktExisting.message }, { status: 500 });

  if ((mktExisting ?? []).length === 0) {
    for (const c of SEED_MARKETING_CLIENTS) {
      const { data: insertedClient, error: eClient } = await supabase
        .from("marketing_clients")
        .insert({
          client_name: c.clientName,
          services: c.services,
          monthly_fee: c.monthlyFee,
          net_amount: c.netAmount,
          creatives_per_month: c.creativesPerMonth,
          owner: c.owner,
          status: c.status,
        })
        .select("id")
        .single();
      if (eClient) return NextResponse.json({ error: eClient.message }, { status: 500 });

      const clientId = (insertedClient as { id: string }).id;
      if (c.records.length) {
        const { error: eRec } = await supabase.from("marketing_monthly_records").insert(
          c.records.map((r) => ({
            client_id: clientId,
            month_key: r.month,
            paid: r.paid,
            payment_status: r.paymentStatus,
            notes: r.notes ?? "",
            paid_at: r.paidAt ?? null,
          }))
        );
        if (eRec) return NextResponse.json({ error: eRec.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ ok: true });
}

