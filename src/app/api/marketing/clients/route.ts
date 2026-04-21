import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/db/supabase/server";
import {
  marketingClientFromRows,
  type DbMarketingClientRow,
  type DbMarketingMonthlyRecordRow,
} from "@/lib/db/mappers";
import { isMarketingService } from "@/lib/marketing/estimates";

export async function GET() {
  const supabase = supabaseServer();
  const { data: clients, error: e1 } = await supabase
    .from("marketing_clients")
    .select("*")
    .order("client_name", { ascending: true });
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

  const { data: records, error: e2 } = await supabase
    .from("marketing_monthly_records")
    .select("*")
    .order("month_key", { ascending: true });
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  const recordsByClient = new Map<string, DbMarketingMonthlyRecordRow[]>();
  for (const r of (records as DbMarketingMonthlyRecordRow[]) ?? []) {
    const arr = recordsByClient.get(r.client_id) ?? [];
    arr.push(r);
    recordsByClient.set(r.client_id, arr);
  }

  const out = ((clients as DbMarketingClientRow[]) ?? []).map((c) =>
    marketingClientFromRows(c, recordsByClient.get(c.id) ?? [])
  );

  return NextResponse.json({ clients: out });
}

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const body = (await req.json()) as {
    clientName: string;
    services: unknown[];
    monthlyFee?: number;
    netAmount?: number;
    creativesPerMonth?: number;
    owner?: string;
    status?: string;
  };

  const services = (Array.isArray(body.services) ? body.services : []).filter(isMarketingService);

  const insert = {
    client_name: String(body.clientName ?? "").trim(),
    services,
    monthly_fee: typeof body.monthlyFee === "number" ? body.monthlyFee : 0,
    net_amount: typeof body.netAmount === "number" ? body.netAmount : 0,
    creatives_per_month: typeof body.creativesPerMonth === "number" ? body.creativesPerMonth : 0,
    owner: body.owner ?? "Team",
    status: body.status ?? "Active",
  };

  if (!insert.client_name) return NextResponse.json({ error: "clientName is required" }, { status: 400 });

  const { data: client, error } = await supabase.from("marketing_clients").insert(insert).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    { client: marketingClientFromRows(client as DbMarketingClientRow, [] as DbMarketingMonthlyRecordRow[]) },
    { status: 201 }
  );
}

