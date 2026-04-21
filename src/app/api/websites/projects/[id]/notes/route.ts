import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/db/supabase/server";
import type { DbWebProjectNoteRow } from "@/lib/db/mappers";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("web_project_notes")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notes: (data as DbWebProjectNoteRow[]) ?? [] });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = supabaseServer();
  const body = (await req.json()) as { author: string; body: string };

  const { data, error } = await supabase
    .from("web_project_notes")
    .insert({ project_id: id, author: body.author, body: body.body })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ note: data }, { status: 201 });
}

