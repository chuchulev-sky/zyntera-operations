import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/db/supabase/server";
import { companyFromRow, companyPatchToRow, type DbCompanyRow } from "@/lib/db/mappers";
import type { Company } from "@/lib/companies/types";
import { normalizeCompanyName } from "@/lib/companies/normalize";

export async function PATCH(req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  const supabase = supabaseServer();
  const body = (await req.json()) as Partial<Company>;

  const target = normalizeCompanyName(decodeURIComponent(name));
  if (!target) return NextResponse.json({ error: "name param is required" }, { status: 400 });

  const patch: Partial<Company> = { ...body };
  if (patch.name !== undefined) patch.name = normalizeCompanyName(String(patch.name));

  const rowPatch = companyPatchToRow(patch);
  delete rowPatch.created_at;
  delete rowPatch.updated_at;

  const { data, error } = await supabase.from("companies").update(rowPatch).eq("name", target).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ company: companyFromRow(data as DbCompanyRow) });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  const supabase = supabaseServer();

  const target = normalizeCompanyName(decodeURIComponent(name));
  if (!target) return NextResponse.json({ error: "name param is required" }, { status: 400 });

  const { error } = await supabase.from("companies").delete().eq("name", target);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}

