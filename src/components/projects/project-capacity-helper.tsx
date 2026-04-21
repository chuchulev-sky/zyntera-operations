"use client";

import * as React from "react";
import type { CommitmentProject } from "@/lib/commitments/types";
import { Card } from "@/components/ui/card";
import { buildCapacityTimeline, departmentForCommitmentCategory, type Department, WEEKLY_CAPACITY_HOURS } from "@/lib/capacity/forecast";

function deptForCategory(category: CommitmentProject["category"]): Department {
  return departmentForCommitmentCategory(category);
}

export function ProjectCapacityHelper({
  category,
  estimatedHours,
  open,
}: {
  category: CommitmentProject["category"];
  estimatedHours: number;
  open: boolean;
}) {
  const [used, setUsed] = React.useState<Record<Department, number>>({ Development: 0, Marketing: 0, Design: 0 });
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/projects", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        const projects = ((json as any).projects ?? []) as CommitmentProject[];
        const active = projects.filter((p) => !p.isArchived);
        const tl = buildCapacityTimeline({ projects: active, weeks: 1 });
        const week0 = tl[0];
        setUsed(week0?.usedByDept ?? { Development: 0, Marketing: 0, Design: 0 });
      })
      .finally(() => setLoading(false));
  }, [open]);

  const dept = deptForCategory(category);
  const capacity = WEEKLY_CAPACITY_HOURS[dept];
  const usedHours = Math.round(used[dept] || 0);
  const free = Math.max(0, capacity - usedHours);
  const est = Math.max(0, Math.round(estimatedHours || 0));
  const insufficient = est > free;

  return (
    <Card className={["zyntera-card p-4", insufficient ? "border-rose-200 bg-rose-50/40" : "border-zinc-200/70 bg-white/70"].join(" ")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold tracking-tight text-zinc-900">Project decision helper</div>
          <div className="mt-1 text-xs text-zinc-600">
            Department: <span className="font-medium">{dept}</span>
          </div>
        </div>
        <div
          className={[
            "rounded-full px-2 py-1 text-xs font-medium",
            insufficient ? "bg-rose-100 text-rose-900" : "bg-emerald-100 text-emerald-900",
          ].join(" ")}
        >
          {insufficient ? "Not enough capacity" : "OK"}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Metric label="Estimated" value={`${est}h`} />
        <Metric label="Free capacity" value={loading ? "…" : `${free}h`} />
        <Metric label="Used / total" value={loading ? "…" : `${usedHours}h / ${capacity}h`} />
      </div>

      {insufficient ? (
        <div className="mt-3 text-xs font-medium text-rose-900">Not enough capacity</div>
      ) : (
        <div className="mt-3 text-xs text-zinc-500">Use this before accepting a new project.</div>
      )}
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200/70 bg-white/70 p-3">
      <div className="text-[11px] text-zinc-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-zinc-900 tabular-nums">{value}</div>
    </div>
  );
}

