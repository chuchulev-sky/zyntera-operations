"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Company } from "@/lib/companies/types";
import { normalizeCompanyName } from "@/lib/companies/normalize";
import { CompanyDetailsSheet } from "@/components/companies/company-details-sheet";

export default function CompaniesPage() {
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");

  const [newName, setNewName] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);

  const [selectedName, setSelectedName] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const url = q.trim() ? `/api/companies?q=${encodeURIComponent(q.trim())}` : "/api/companies";
      const res = await fetch(url, { cache: "no-store" });
      const json = (await res.json()) as { companies: Company[] };
      setCompanies(json.companies ?? []);
    } finally {
      setLoading(false);
    }
  }, [q]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const selected = React.useMemo(() => {
    if (!selectedName) return null;
    return companies.find((c) => c.name === selectedName) ?? null;
  }, [companies, selectedName]);

  async function create() {
    const name = normalizeCompanyName(newName);
    if (!name) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to create company");
      setNewName("");
      await load();
      setSelectedName(name);
    } catch (e: any) {
      setCreateError(String(e?.message ?? e));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
          <p className="text-sm text-zinc-500">Company profiles linked to projects by name.</p>
        </div>
      </div>

      <Card className="zyntera-card">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Directory</CardTitle>
            <Badge variant="secondary">{loading ? "Loading…" : `${companies.length} shown`}</Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search company…" />

            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New company name…" />

            <Button
              className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-900/90"
              disabled={creating || !normalizeCompanyName(newName)}
              onClick={create}
            >
              {creating ? "Creating…" : "Add company"}
            </Button>
          </div>

          {createError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{createError}</div>
          ) : null}
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Contacts</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-sm text-zinc-500">
                      Loading companies…
                    </TableCell>
                  </TableRow>
                ) : companies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-sm text-zinc-500">
                      No companies match the current search.
                    </TableCell>
                  </TableRow>
                ) : (
                  companies.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="max-w-[320px]">
                        <div className="flex flex-wrap gap-1.5">
                          {(c.tags ?? []).length === 0 ? (
                            <span className="text-xs text-zinc-500">—</span>
                          ) : (
                            (c.tags ?? []).slice(0, 6).map((t) => (
                              <Badge key={t} variant="secondary">
                                {t}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-zinc-600">{(c.contacts ?? []).length || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" className="rounded-xl" onClick={() => setSelectedName(c.name)}>
                          Open
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CompanyDetailsSheet
        company={selected}
        open={Boolean(selectedName)}
        onOpenChange={(next) => setSelectedName(next ? selectedName : null)}
        onSaved={async (nextName) => {
          await load();
          setSelectedName(nextName);
        }}
        onDeleted={async () => {
          setSelectedName(null);
          await load();
        }}
      />
    </div>
  );
}

