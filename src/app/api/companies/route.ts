import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/db/supabase/server";
import { companyFromRow, type DbCompanyRow } from "@/lib/db/mappers";
import type { Company } from "@/lib/companies/types";
import { normalizeCompanyName } from "@/lib/companies/normalize";

export async function GET(req: Request) {
  const supabase = supabaseServer();
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();

  let query = supabase.from("companies").select("*").order("updated_at", { ascending: false });
  if (q) query = query.ilike("name", `%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const companies = ((data as DbCompanyRow[]) ?? []).map(companyFromRow);
  return NextResponse.json({ companies });
}

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const body = (await req.json()) as Partial<Company> & { contacts?: unknown; tags?: unknown };

  const name = normalizeCompanyName(String(body.name ?? ""));
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const insert = {
    name,
    notes: String(body.notes ?? ""),
    tags: Array.isArray(body.tags) ? body.tags.map((t) => String(t)) : [],
    website: String(body.website ?? ""),
    linkedin: String(body.linkedin ?? ""),
    billing_email: String(body.billingEmail ?? ""),
    billing_address: String(body.billingAddress ?? ""),
    vat_number: String(body.vatNumber ?? ""),
    contacts_json: Array.isArray(body.contacts) ? body.contacts : [],
  };

  const { data, error } = await supabase.from("companies").insert(insert).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ company: companyFromRow(data as DbCompanyRow) }, { status: 201 });
}

