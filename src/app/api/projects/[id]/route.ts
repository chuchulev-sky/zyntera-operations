import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/db/supabase/server";
import {
  commitmentProjectFromRow,
  commitmentProjectPatchToRow,
  type DbCommitmentProjectRow,
} from "@/lib/db/mappers";
import type { CommitmentProject } from "@/lib/commitments/types";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = supabaseServer();
  const body = (await req.json()) as Partial<CommitmentProject> & { archive?: boolean };

  if (body.archive) {
    const { data, error } = await supabase
      .from("commitment_projects")
      .update({ is_archived: true })
      .eq("id", id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ project: commitmentProjectFromRow(data as DbCommitmentProjectRow) });
  }

  const rowPatch = commitmentProjectPatchToRow(body);
  let data: unknown = null;
  let error: { message: string } | null = null;

  {
    const res = await supabase.from("commitment_projects").update(rowPatch).eq("id", id).select("*").single();
    data = res.data;
    error = (res.error as any) ?? null;
  }

  if (error) {
    const msg = String(error.message ?? "");
    const scheduleColumnMissing =
      (msg.toLowerCase().includes("start_date") || msg.toLowerCase().includes("target_end_date")) &&
      (msg.toLowerCase().includes("column") || msg.toLowerCase().includes("schema cache"));

    if (scheduleColumnMissing) {
      const { start_date: _sd, target_end_date: _ed, ...withoutSchedule } = rowPatch as any;
      const res2 = await supabase.from("commitment_projects").update(withoutSchedule).eq("id", id).select("*").single();
      data = res2.data;
      error = (res2.error as any) ?? null;
    }
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ project: commitmentProjectFromRow(data as DbCommitmentProjectRow) });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = supabaseServer();

  const { error } = await supabase.from("commitment_projects").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}

