"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { CommitmentProject } from "@/lib/commitments/types";
import { PAYMENT_STATUSES, WORKLOAD_STATUSES } from "@/lib/commitments/types";
import { NewCommitmentProjectModal } from "@/components/projects/new-commitment-project-modal";
import { EditCommitmentProjectModal } from "@/components/projects/edit-commitment-project-modal";
import type { Company } from "@/lib/companies/types";
import { normalizeCompanyName } from "@/lib/companies/normalize";
import { CompanyDetailsSheet } from "@/components/companies/company-details-sheet";

type SortKey = "updatedAt";

export default function ProjectsPageClient() {
  const [projects, setProjects] = React.useState<CommitmentProject[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [companies, setCompanies] = React.useState<Company[]>([]);

  const [q, setQ] = React.useState("");
  const [category, setCategory] = React.useState<CommitmentProject["category"] | "All">("All");
  const [company, setCompany] = React.useState<string | "All">("All");
  const [paymentStatus, setPaymentStatus] = React.useState<CommitmentProject["paymentStatus"] | "All">("All");
  const [workloadStatus, setWorkloadStatus] = React.useState<CommitmentProject["workloadStatus"] | "All">("All");
  const [sortKey, setSortKey] = React.useState<SortKey>("updatedAt");
  const [selectedCompanyName, setSelectedCompanyName] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/projects", { cache: "no-store" });
      const json = (await res.json()) as { projects: CommitmentProject[] };
      setProjects((json.projects ?? []).filter((p) => !p.isArchived));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCompanies = React.useCallback(async () => {
    const res = await fetch("/api/companies", { cache: "no-store" });
    const json = (await res.json()) as { companies: Company[] };
    setCompanies(json.companies ?? []);
  }, []);

  React.useEffect(() => {
    void load();
    void loadCompanies();
  }, [load, loadCompanies]);

  const companyOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) {
      const n = normalizeCompanyName(p.companyName);
      if (n) set.add(n);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  const selectedCompany = React.useMemo(() => {
    if (!selectedCompanyName) return null;
    return companies.find((c) => c.name === selectedCompanyName) ?? null;
  }, [companies, selectedCompanyName]);

  const ensureCompany = React.useCallback(
    async (name: string) => {
      const normalized = normalizeCompanyName(name);
      if (!normalized) return;
      if (companies.some((c) => c.name === normalized)) {
        setSelectedCompanyName(normalized);
        return;
      }

      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: normalized }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to create company");
      await loadCompanies();
      setSelectedCompanyName(normalized);
    },
    [companies, loadCompanies]
  );

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return projects
      .filter((p) => {
        if (category !== "All" && p.category !== category) return false;
        if (company !== "All" && normalizeCompanyName(p.companyName) !== company) return false;
        if (paymentStatus !== "All" && p.paymentStatus !== paymentStatus) return false;
        if (workloadStatus !== "All" && p.workloadStatus !== workloadStatus) return false;
        if (!needle) return true;
        const hay = `${p.clientName} ${p.companyName} ${p.projectName}`.toLowerCase();
        return hay.includes(needle);
      })
      .sort((a, b) => {
        if (sortKey === "updatedAt") return b.updatedAt.localeCompare(a.updatedAt);
        return 0;
      });
  }, [projects, q, category, company, paymentStatus, workloadStatus, sortKey]);

  const deleteProject = React.useCallback(
    async (id: string) => {
      const ok = window.confirm("Delete this project? This cannot be undone.");
      if (!ok) return;
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete project");
      await load();
    },
    [load]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-zinc-500">Real commitments only. Filter by category, payment, and workload health.</p>
        </div>
        <NewCommitmentProjectModal
          onCreated={load}
          trigger={<Button className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-900/90">Add project</Button>}
        />
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Projects table</CardTitle>
            <Badge variant="secondary">{loading ? "Loading…" : `${filtered.length} shown`}</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search client, company, project…" />

            <Select value={category} onValueChange={(v) => setCategory(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All categories</SelectItem>
                <SelectItem value="Website">Website</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Design">Design</SelectItem>
              </SelectContent>
            </Select>

            <Select value={company} onValueChange={(v) => setCompany(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All companies</SelectItem>
                {companyOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All payments</SelectItem>
                {PAYMENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={workloadStatus} onValueChange={(v) => setWorkloadStatus(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Workload" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All workload</SelectItem>
                {WORKLOAD_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {/* Mobile: card boxes */}
          <div className="md:hidden p-3">
            {loading ? (
              <div className="py-10 text-center text-sm text-zinc-500">Loading commitments…</div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-sm text-zinc-500">No projects match the current filters.</div>
            ) : (
              <div className="space-y-3">
                {filtered.map((p) => {
                  const outstanding = Math.max(0, (p.invoicedAmount || 0) - (p.paidAmount || 0));
                  return (
                    <Card key={p.id} className="zyntera-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold tracking-tight text-zinc-900 line-clamp-1">{p.projectName}</div>
                          <div className="mt-1 text-xs text-zinc-500 line-clamp-1">
                            <button
                              type="button"
                              className="hover:underline"
                              onClick={async () => {
                                await ensureCompany(p.companyName);
                              }}
                            >
                              {p.companyName}
                            </button>{" "}
                            • {p.clientName}
                          </div>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {p.category}
                        </Badge>
                      </div>

                      <div className="mt-2 text-xs text-zinc-500 line-clamp-2">
                        {(p.selectedServices ?? []).map((s) => s.name).join(", ") || "—"}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-zinc-200/70 bg-white/70 p-3">
                          <div className="text-[11px] text-zinc-500">Hours</div>
                          <div className="mt-1 text-sm font-semibold text-zinc-900">
                            {p.committedHours || 0}
                            <span className="text-zinc-500"> / {p.estimatedHours || 0}</span>
                          </div>
                        </div>
                        <div className="rounded-xl border border-zinc-200/70 bg-white/70 p-3">
                          <div className="text-[11px] text-zinc-500">Revenue</div>
                          <div className="mt-1 text-sm font-semibold text-zinc-900">{formatEUR(p.priceTotal || 0)}</div>
                          <div className="mt-0.5 text-[11px] text-zinc-500">
                            Paid {formatEUR(p.paidAmount || 0)} • Out {formatEUR(outstanding)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            p.paymentStatus === "Paid"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                              : p.paymentStatus === "Partial"
                                ? "border-amber-200 bg-amber-50 text-amber-900"
                                : p.paymentStatus === "Retainer"
                                  ? "border-indigo-200 bg-indigo-50 text-indigo-900"
                                  : p.paymentStatus === "Subscription"
                                    ? "border-sky-200 bg-sky-50 text-sky-900"
                                    : "border-zinc-200 bg-white text-zinc-700"
                          }
                        >
                          {p.paymentStatus}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            p.workloadStatus === "Overloaded"
                              ? "border-rose-200 bg-rose-50 text-rose-900"
                              : p.workloadStatus === "AtRisk"
                                ? "border-amber-200 bg-amber-50 text-amber-900"
                                : "border-emerald-200 bg-emerald-50 text-emerald-900"
                          }
                        >
                          {p.workloadStatus}
                        </Badge>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <EditCommitmentProjectModal
                          project={p}
                          onSaved={load}
                          trigger={
                            <Button variant="outline" className="rounded-xl w-full">
                              Edit
                            </Button>
                          }
                        />
                        <Button
                          variant="destructive"
                          className="rounded-xl w-full"
                          onClick={async () => {
                            await deleteProject(p.id);
                          }}
                        >
                          Del
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client / Company</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Workload</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-sm text-zinc-500">
                      Loading commitments…
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-sm text-zinc-500">
                      No projects match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="min-w-[220px]">
                          <button
                            type="button"
                            className="text-left text-sm font-medium hover:underline"
                            onClick={async () => {
                              await ensureCompany(p.companyName);
                            }}
                          >
                            {p.companyName}
                          </button>
                          <div className="text-xs text-zinc-500">{p.clientName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-[260px]">
                          <div className="text-sm font-medium">{p.projectName}</div>
                          <div className="mt-1 text-xs text-zinc-500 line-clamp-1">
                            {(p.selectedServices ?? []).map((s) => s.name).join(", ") || "—"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{p.category}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm">
                          <span className="font-medium">{p.committedHours || 0}</span>
                          <span className="text-zinc-500"> / {p.estimatedHours || 0}</span>
                        </div>
                        <div className="text-xs text-zinc-500">committed / est.</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm font-medium">{formatEUR(p.priceTotal || 0)}</div>
                        <div className="text-xs text-zinc-500">
                          Paid {formatEUR(p.paidAmount || 0)} • Out{" "}
                          {formatEUR(Math.max(0, (p.invoicedAmount || 0) - (p.paidAmount || 0)))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            p.paymentStatus === "Paid"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                              : p.paymentStatus === "Partial"
                                ? "border-amber-200 bg-amber-50 text-amber-900"
                                : p.paymentStatus === "Retainer"
                                  ? "border-indigo-200 bg-indigo-50 text-indigo-900"
                                  : p.paymentStatus === "Subscription"
                                    ? "border-sky-200 bg-sky-50 text-sky-900"
                                    : "border-zinc-200 bg-white text-zinc-700"
                          }
                        >
                          {p.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            p.workloadStatus === "Overloaded"
                              ? "border-rose-200 bg-rose-50 text-rose-900"
                              : p.workloadStatus === "AtRisk"
                                ? "border-amber-200 bg-amber-50 text-amber-900"
                                : "border-emerald-200 bg-emerald-50 text-emerald-900"
                          }
                        >
                          {p.workloadStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <EditCommitmentProjectModal
                            project={p}
                            onSaved={load}
                            trigger={
                              <Button variant="outline" className="rounded-xl">
                                Edit
                              </Button>
                            }
                          />
                          <Button
                            variant="destructive"
                            className="rounded-xl"
                            onClick={async () => {
                              await deleteProject(p.id);
                            }}
                          >
                            Del
                          </Button>
                        </div>
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
        company={selectedCompany}
        open={Boolean(selectedCompanyName)}
        onOpenChange={(next) => setSelectedCompanyName(next ? selectedCompanyName : null)}
        onSaved={async (nextName) => {
          await loadCompanies();
          setSelectedCompanyName(nextName);
        }}
        onDeleted={async () => {
          setSelectedCompanyName(null);
          await loadCompanies();
        }}
      />
    </div>
  );
}

function formatEUR(value: number): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
  } catch {
    return `EUR ${Math.round(value).toLocaleString()}`;
  }
}

