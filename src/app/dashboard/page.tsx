"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Offer } from "@/lib/offers/types";
import type { CommitmentProject } from "@/lib/commitments/types";
import { formatMoneySummary, calculateRevenueFromCommitments, calculateRevenueFromOffers } from "@/lib/revenue/derived";
import { buildCapacityTimeline, DEPARTMENTS, formatWeekLabel, type Department, WEEKLY_CAPACITY_HOURS } from "@/lib/capacity/forecast";

const DEPT_OPTIONS: Department[] = ["Development", "Design", "Marketing"];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-500">
          Decision view for revenue, capacity, risk, and client value.
        </p>
      </div>

      <DashboardContent />
    </div>
  );
}

function DashboardContent() {
  const [offers, setOffers] = React.useState<Offer[]>([]);
  const [projects, setProjects] = React.useState<CommitmentProject[]>([]);
  const [dept, setDept] = React.useState<Department>("Development");

  React.useEffect(() => {
    void Promise.all([
      fetch("/api/offers", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/projects", { cache: "no-store" }).then((r) => r.json()),
    ]).then(([o, p]) => {
      setOffers(((o as any).offers ?? []) as Offer[]);
      setProjects(((p as any).projects ?? []) as CommitmentProject[]);
    });
  }, []);

  const activeOffers = offers.filter((o) => !o.isArchived);
  const activeProjects = projects.filter((p) => !p.isArchived);

  const offerDrafts = activeOffers.filter((o) => o.status === "Draft").length;
  const offerSent = activeOffers.filter((o) => o.status === "Sent").length;
  const offerAccepted = activeOffers.filter((o) => o.status === "Accepted").length;

  const activeCount = activeProjects.length;
  const pretovarvane = activeProjects.filter((p) => p.workloadStatus === "Overloaded").length;
  const risk = activeProjects.filter((p) => p.workloadStatus === "AtRisk").length;

  const offerRev = calculateRevenueFromOffers(activeOffers);
  const projRev = calculateRevenueFromCommitments(activeProjects);

  const estimatedRevenue = formatMoneySummary(offerRev.estimated);
  const confirmedRevenue = formatMoneySummary(projRev.confirmed);
  const paidRevenue = formatMoneySummary(projRev.paid);
  const outstandingRevenue = formatMoneySummary(projRev.outstanding);

  const usedByDept = React.useMemo(() => {
    const out: Record<Department, number> = { Development: 0, Marketing: 0, Design: 0 };
    for (const p of activeProjects) {
      const dept: Department = p.category === "Marketing" ? "Marketing" : p.category === "Design" ? "Design" : "Development";
      out[dept] += Number(p.committedHours || 0);
    }
    return out;
  }, [activeProjects]);

  const freeByDept = React.useMemo(() => {
    const out: Record<Department, number> = { Development: 0, Marketing: 0, Design: 0 };
    for (const dept of Object.keys(WEEKLY_CAPACITY_HOURS) as Department[]) {
      out[dept] = Math.max(0, WEEKLY_CAPACITY_HOURS[dept] - (usedByDept[dept] || 0));
    }
    return out;
  }, [usedByDept]);

  const timeline = React.useMemo(() => buildCapacityTimeline({ projects: activeProjects, weeks: 6 }), [activeProjects]);

  const clientValueRows = React.useMemo(() => {
    const byClient = new Map<string, { revenue: number; hours: number }>();
    for (const p of activeProjects) {
      if ((p.currency ?? "EUR") !== "EUR") continue;
      const key = p.clientName || "—";
      const prev = byClient.get(key) ?? { revenue: 0, hours: 0 };
      prev.revenue += Number(p.priceTotal || 0);
      prev.hours += Number(p.committedHours || 0);
      byClient.set(key, prev);
    }
    const rows = Array.from(byClient.entries()).map(([client, v]) => ({
      client,
      revenue: v.revenue,
      hours: v.hours,
      eurPerHour: v.hours > 0 ? v.revenue / v.hours : 0,
    }));
    rows.sort((a, b) => b.eurPerHour - a.eurPerHour);

    const values = rows.map((r) => r.eurPerHour).filter((x) => Number.isFinite(x));
    values.sort((a, b) => a - b);
    const q = (p: number) => {
      if (values.length === 0) return 0;
      const idx = Math.min(values.length - 1, Math.max(0, Math.floor(p * (values.length - 1))));
      return values[idx];
    };
    const high = q(0.75);
    const low = q(0.25);

    return rows.map((r) => ({
      ...r,
      tone: r.eurPerHour >= high ? "high" : r.eurPerHour <= low ? "low" : "mid",
    }));
  }, [activeProjects]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <KpiCard title="Offers (Draft)" value={offerDrafts} />
        <KpiCard title="Offers (Sent)" value={offerSent} tone="scheduled" />
        <KpiCard title="Offers (Accepted)" value={offerAccepted} tone="active" />
        <KpiCard title="Активни проекти" value={activeCount} tone="completed" />
        <KpiCard title="Риск" value={risk} tone="waiting" />
        <KpiCard title="Претоварване" value={pretovarvane} tone="blocked" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <ValueCard title="Estimated (offers)" value={estimatedRevenue} />
            <ValueCard title="Confirmed (projects)" value={confirmedRevenue} accent />
            <ValueCard title="Paid" value={paidRevenue} />
            <ValueCard title="Outstanding" value={outstandingRevenue} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Capacity Overview (Team Capacity)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(Object.keys(WEEKLY_CAPACITY_HOURS) as Department[]).map((dept) => {
              const cap = WEEKLY_CAPACITY_HOURS[dept];
              const used = Math.round(usedByDept[dept] || 0);
              const free = Math.round(freeByDept[dept] || 0);
              const pct = cap > 0 ? Math.min(100, (used / cap) * 100) : 0;
              const tone = free <= 0 ? "blocked" : free <= cap * 0.15 ? "waiting" : "ok";

              return (
                <div key={dept} className="rounded-xl border bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold tracking-tight text-zinc-900">{dept}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        Capacity: <span className="font-medium text-zinc-700">{cap}h</span> • Used:{" "}
                        <span className="font-medium text-zinc-700">{used}h</span> • Free:{" "}
                        <span className={tone === "blocked" ? "font-semibold text-rose-700" : "font-semibold text-emerald-700"}>
                          {free}h
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        tone === "blocked"
                          ? "border-rose-200 bg-rose-50 text-rose-900"
                          : tone === "waiting"
                            ? "border-amber-200 bg-amber-50 text-amber-900"
                            : "border-emerald-200 bg-emerald-50 text-emerald-900"
                      }
                    >
                      {tone === "blocked" ? "Not enough" : tone === "waiting" ? "Tight" : "OK"}
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <Progress value={pct} />
                  </div>
                </div>
              );
            })}
            <Separator />
            <div className="text-xs text-zinc-500">Capacity is computed from committed hours in active projects.</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Capacity Timeline</CardTitle>
            <div className="text-sm text-zinc-500">Next 6 weeks. Simple weekly forecast (even distribution).</div>
          </div>
          <div className="flex items-center gap-1.5">
            {DEPT_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDept(d)}
                className={[
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  dept === d ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-700",
                ].join(" ")}
              >
                {d}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {timeline.map((w) => {
              const cap = WEEKLY_CAPACITY_HOURS[dept];
              const used = Math.round(w.usedByDept[dept] || 0);
              const free = cap - used;
              const pct = cap > 0 ? Math.min(120, (used / cap) * 100) : 0;
              const tone = used >= cap ? (used > cap ? "over" : "full") : used >= cap * 0.85 ? "tight" : "ok";
              const barClass = tone === "over" ? "bg-rose-600" : tone === "full" ? "bg-amber-600" : tone === "tight" ? "bg-sky-600" : "bg-emerald-600";

              return (
                <div key={w.weekKey} className={["rounded-xl border p-4", tone === "over" ? "border-rose-200 bg-rose-50/30" : tone === "full" ? "border-amber-200 bg-amber-50/30" : "border-zinc-200 bg-white"].join(" ")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold tracking-tight text-zinc-900">{formatWeekLabel(w.weekStart)}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        Capacity <span className="font-medium text-zinc-700">{cap}h</span> • Used{" "}
                        <span className="font-medium text-zinc-700">{used}h</span> • Free{" "}
                        <span className={free <= 0 ? "font-semibold text-rose-700" : "font-semibold text-emerald-700"}>
                          {free}h
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        tone === "over"
                          ? "border-rose-200 bg-rose-50 text-rose-900"
                          : tone === "full"
                            ? "border-amber-200 bg-amber-50 text-amber-900"
                            : "border-emerald-200 bg-emerald-50 text-emerald-900"
                      }
                    >
                      {tone === "over" ? "Overloaded" : tone === "full" ? "Full" : free <= cap * 0.15 ? "Tight" : "Available"}
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                      <div className={barClass} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
                    </div>
                    {used > cap ? (
                      <div className="mt-2 text-xs font-medium text-rose-900">Over by {Math.round(used - cap)}h</div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Active Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeProjects.length === 0 ? (
              <EmptyLine label="No active projects yet." />
            ) : (
              activeProjects
                .slice()
                .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                .slice(0, 6)
                .map((p) => (
                  <div key={p.id} className="rounded-lg border bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{p.projectName}</div>
                        <div className="truncate text-xs text-zinc-500">
                          {p.companyName} • {p.clientName}
                        </div>
                      </div>
                      <Badge variant="secondary">{p.category}</Badge>
                    </div>
                    <div className="mt-2 text-xs text-zinc-600">
                      Estimated {p.estimatedHours}h • Committed {p.committedHours}h
                    </div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Risk / Overload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeProjects.filter((p) => p.workloadStatus !== "Healthy").length === 0 ? (
              <EmptyLine label="No overload warnings." />
            ) : (
              activeProjects
                .filter((p) => p.workloadStatus !== "Healthy")
                .slice(0, 6)
                .map((p) => (
                  <div key={p.id} className="rounded-lg border bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{p.projectName}</div>
                        <div className="truncate text-xs text-zinc-500">{p.companyName}</div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          p.workloadStatus === "Overloaded"
                            ? "border-rose-200 bg-rose-50 text-rose-900"
                            : "border-amber-200 bg-amber-50 text-amber-900"
                        }
                      >
                        {p.workloadStatus === "Overloaded" ? "Претоварване" : "Риск"}
                      </Badge>
                    </div>
                    <div className="mt-2 text-xs text-zinc-600">
                      Committed {p.committedHours}h • Confirmed {formatEUR(p.priceTotal)}
                    </div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">High value vs low value clients</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Revenue (€)</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">€/hour</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientValueRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center text-sm text-zinc-500">
                        No EUR commitments yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    clientValueRows.slice(0, 12).map((r) => (
                      <TableRow
                        key={r.client}
                        className={
                          r.tone === "high"
                            ? "bg-emerald-50/40"
                            : r.tone === "low"
                              ? "bg-rose-50/40"
                              : undefined
                        }
                      >
                        <TableCell className="font-medium">{r.client}</TableCell>
                        <TableCell className="text-right tabular-nums">{Math.round(r.revenue).toLocaleString()}</TableCell>
                        <TableCell className="text-right tabular-nums">{Math.round(r.hours).toLocaleString()}</TableCell>
                        <TableCell
                          className={
                            r.tone === "high"
                              ? "text-right font-semibold text-emerald-700 tabular-nums"
                              : r.tone === "low"
                                ? "text-right font-semibold text-rose-700 tabular-nums"
                                : "text-right font-medium text-zinc-800 tabular-nums"
                          }
                        >
                          {Number.isFinite(r.eurPerHour) ? Math.round(r.eurPerHour).toLocaleString() : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="px-4 pb-4 pt-3 text-xs text-zinc-500">
              Highlighting is relative (top/bottom quartile by €/hour). Values use committed hours and confirmed revenue (EUR).
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: number;
  tone?: "scheduled" | "active" | "waiting" | "blocked" | "completed";
}) {
  const badge =
    tone === "scheduled"
      ? "bg-indigo-600 text-white hover:bg-indigo-600"
      : tone === "active"
        ? "bg-emerald-600 text-white hover:bg-emerald-600"
        : tone === "waiting"
          ? "bg-sky-600 text-white hover:bg-sky-600"
          : tone === "blocked"
            ? "bg-amber-600 text-white hover:bg-amber-600"
            : tone === "completed"
              ? "bg-zinc-900 text-white hover:bg-zinc-900"
              : "bg-zinc-100 text-zinc-900 hover:bg-zinc-100";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-600">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        <Badge className={badge}>Live</Badge>
      </CardContent>
    </Card>
  );
}

function ValueCard({
  title,
  value,
  accent,
}: {
  title: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card className={accent ? "border-zinc-200/70 bg-white/70" : undefined}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-600">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <div className="text-xl font-semibold tracking-tight text-zinc-900">{value}</div>
        {accent ? (
          <Badge className="border-transparent bg-gradient-to-r from-indigo-500/90 to-fuchsia-500/90 text-white shadow-sm hover:from-indigo-500/90 hover:to-fuchsia-500/90" variant="outline">
            Commercial
          </Badge>
        ) : (
          <Badge variant="secondary">Live</Badge>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyLine({ label }: { label: string }) {
  return <div className="rounded-lg border bg-white p-3 text-sm text-zinc-600">{label}</div>;
}

function formatEUR(value: number): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
  } catch {
    return `EUR ${Math.round(value).toLocaleString()}`;
  }
}

