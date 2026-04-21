import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/db/supabase/server";
import { webProjectFromRow, webProjectPatchToRow, type DbWebProjectRow } from "@/lib/db/mappers";
import type { Project } from "@/lib/projects/types";

export async function PATCH(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = supabaseServer();
  const patch = (await _.json()) as Partial<{
    clientName: string;
    companyName: string;
    projectName: string;
    projectType: string;
    sourceOwner: string;
    status: string;
    priority: string;
    startDate: string;
    targetEndDate: string;
    notes: string;
    blockedReason: string | null;
    sortIndex: number | null;
    proposalAmount: number;
    agreedAmount: number;
    invoicedAmount: number;
    paidAmount: number;
    currency: string;
    paymentStatus: string;
    checklist: unknown;
    isArchived: boolean;
    services: unknown;
  }>;

  const rowPatch = webProjectPatchToRow(patch as unknown as Partial<Project>);
  const { data, error } = await supabase
    .from("web_projects")
    .update(rowPatch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ project: webProjectFromRow(data as DbWebProjectRow) });
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = supabaseServer();
  const { error } = await supabase.from("web_projects").update({ is_archived: true }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

