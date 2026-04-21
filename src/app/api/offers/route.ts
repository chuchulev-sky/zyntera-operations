import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/db/supabase/server";
import { estimateOffer } from "@/lib/offers/estimation";
import { offerFromRow, type DbOfferRow } from "@/lib/db/mappers";
import type { Offer } from "@/lib/offers/types";

export async function GET() {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const offers = ((data as DbOfferRow[]) ?? []).map(offerFromRow);
  return NextResponse.json({ offers });
}

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const body = (await req.json()) as Partial<Offer> & {
    creativesPerMonth?: number;
    manual?: boolean;
  };

  const selectedServices = Array.isArray(body.selectedServices) ? body.selectedServices : [];
  const category = (body.category ?? "Website") as Offer["category"];
  const complexity = (body.complexity ?? "Medium") as Offer["complexity"];

  const manual = Boolean(body.manual);
  const est = manual
    ? null
    : estimateOffer({
        category,
        complexity,
        selectedServices,
        creativesPerMonth: body.creativesPerMonth ?? 0,
      });

  const insert = {
    client_name: String(body.clientName ?? "").trim(),
    company_name: String(body.companyName ?? "").trim(),
    project_name: String(body.projectName ?? "").trim(),
    category,
    complexity,
    notes: String(body.notes ?? ""),
    selected_services_json: selectedServices,
    estimated_hours_total: manual ? (body.estimatedHours ?? 0) : est!.estimatedHoursTotal,
    estimated_timeline_days: manual ? (body.estimatedTimelineDays ?? 0) : est!.estimatedTimelineDays,
    suggested_price: manual ? (body.suggestedPrice ?? 0) : est!.suggestedPrice,
    currency: manual ? (body.currency ?? "EUR") : est!.currency,
    workload_by_department_json: manual ? (body.workloadByDepartment ?? {}) : est!.workloadByDepartment,
    status: body.status ?? "Draft",
    is_archived: body.isArchived ?? false,
  };

  if (!insert.client_name || !insert.company_name || !insert.project_name) {
    return NextResponse.json({ error: "clientName, companyName, projectName are required" }, { status: 400 });
  }

  const { data, error } = await supabase.from("offers").insert(insert).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ offer: offerFromRow(data as DbOfferRow) }, { status: 201 });
}

