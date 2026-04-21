import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/db/supabase/server";
import { offerFromRow, type DbOfferRow, commitmentProjectFromRow, type DbCommitmentProjectRow } from "@/lib/db/mappers";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = supabaseServer();

  const { data: offerRow, error: e1 } = await supabase.from("offers").select("*").eq("id", id).single();
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });
  const offer = offerFromRow(offerRow as DbOfferRow);

  // Create commitment project snapshot from offer.
  const insert = {
    offer_id: offer.id,
    origin: "From Offer",
    client_name: offer.clientName,
    company_name: offer.companyName,
    project_name: offer.projectName,
    category: offer.category,
    selected_services_json: offer.selectedServices,
    estimated_hours_total: offer.estimatedHours,
    committed_hours_total: offer.estimatedHours,
    progress: 0,
    workload_status: "Healthy",
    price_total: offer.suggestedPrice,
    currency: offer.currency ?? "EUR",
    payment_status: "Unpaid",
    invoiced_amount: 0,
    paid_amount: 0,
    notes: offer.notes ?? "",
    is_archived: false,
  };

  const { data: projectRow, error: e2 } = await supabase
    .from("commitment_projects")
    .insert(insert)
    .select("*")
    .single();
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  // Mark offer as accepted (keeps pipeline history but reflects commitment).
  await supabase.from("offers").update({ status: "Accepted" }).eq("id", offer.id);

  return NextResponse.json({ project: commitmentProjectFromRow(projectRow as DbCommitmentProjectRow) }, { status: 201 });
}

