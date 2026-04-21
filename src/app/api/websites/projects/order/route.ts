import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/db/supabase/server";

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const body = (await req.json()) as { status: string; orderedIds: string[] };

  // Update sort_index for all projects in the given status.
  // This is a simple loop; can be optimized later with SQL.
  const updates = body.orderedIds.map((id, idx) => ({ id, sort_index: idx }));
  for (const u of updates) {
    const { error } = await supabase.from("web_projects").update({ sort_index: u.sort_index }).eq("id", u.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

