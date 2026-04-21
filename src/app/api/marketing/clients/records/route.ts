import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/db/supabase/server";

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const body = (await req.json()) as {
    clientId: string;
    monthKey: string; // YYYY-MM
    paymentStatus: "Paid" | "Unpaid" | "Late";
    notes?: string;
  };

  const paid = body.paymentStatus === "Paid";
  const paidAt = paid ? new Date().toISOString() : null;

  const { data, error } = await supabase
    .from("marketing_monthly_records")
    .upsert(
      {
        client_id: body.clientId,
        month_key: body.monthKey,
        paid,
        payment_status: body.paymentStatus,
        paid_at: paidAt,
        notes: body.notes ?? "",
      },
      { onConflict: "client_id,month_key" }
    )
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ record: data }, { status: 200 });
}

