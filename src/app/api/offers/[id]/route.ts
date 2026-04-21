import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/db/supabase/server";
import { estimateOffer } from "@/lib/offers/estimation";
import { offerFromRow, offerPatchToRow, type DbOfferRow } from "@/lib/db/mappers";
import type { Offer } from "@/lib/offers/types";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = supabaseServer();
  const body = (await req.json()) as Partial<Offer> & { creativesPerMonth?: number; recompute?: boolean; manual?: boolean };

  if ((body as any).archive) {
    const { data, error } = await supabase.from("offers").update({ is_archived: true }).eq("id", id).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ offer: offerFromRow(data as DbOfferRow) });
  }

  const manual = Boolean(body.manual);
  const shouldRecompute =
    !manual &&
    (Boolean(body.recompute) ||
      body.category !== undefined ||
      body.complexity !== undefined ||
      body.selectedServices !== undefined);

  const patch: Partial<Offer> = { ...body };

  if (shouldRecompute) {
    const selectedServices = Array.isArray(body.selectedServices) ? body.selectedServices : [];
    const category = (body.category ?? "Website") as Offer["category"];
    const complexity = (body.complexity ?? "Medium") as Offer["complexity"];
    const est = estimateOffer({
      category,
      complexity,
      selectedServices,
      creativesPerMonth: body.creativesPerMonth ?? 0,
    });
    patch.estimatedHours = est.estimatedHoursTotal;
    patch.estimatedTimelineDays = est.estimatedTimelineDays;
    patch.suggestedPrice = est.suggestedPrice;
    patch.currency = est.currency;
    patch.workloadByDepartment = est.workloadByDepartment;
  }

  const rowPatch = offerPatchToRow(patch);
  delete rowPatch.created_at;
  delete rowPatch.updated_at;

  const { data, error } = await supabase.from("offers").update(rowPatch).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ offer: offerFromRow(data as DbOfferRow) });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = supabaseServer();

  const { error } = await supabase.from("offers").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}

