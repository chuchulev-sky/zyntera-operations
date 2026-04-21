"use client";

import * as React from "react";
import type { BusinessStatus, Project, SourceOwner } from "@/lib/projects/types";
import { BUSINESS_STATUSES, SOURCE_OWNERS } from "@/lib/projects/types";
import { useProjectStore } from "@/lib/projects/store";
import { checklistCompletion, currentStageLabel, formatShortDate, isBlocked, isOverdue, parseIsoDate } from "@/lib/projects/helpers";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/projects/project-badges";
import { ProjectProgressBar } from "@/components/projects/project-progress";
import { ProjectDetailsSheet } from "@/components/projects/project-details-sheet";

type SortKey = "startDate";

export function ProjectsTable({ projects }: { projects: Project[] }) {
  const { selectedProjectId, selectProject } = useProjectStore();
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<BusinessStatus | "All">("All");
  const [owner, setOwner] = React.useState<SourceOwner | "All">("All");
  const [sortKey, setSortKey] = React.useState<SortKey>("startDate");

  const filtered = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    return projects
      .filter((p) => {
        if (status !== "All" && p.status !== status) return false;
        if (owner !== "All" && p.sourceOwner !== owner) return false;
        if (!query) return true;
        const serviceNames = (p.services ?? []).map((s) => s.name).join(" ");
        const hay = `${p.clientName} ${p.companyName} ${p.projectName} ${p.projectType} ${serviceNames}`.toLowerCase();
        return hay.includes(query);
      })
      .sort((a, b) => {
        if (sortKey === "startDate") return parseIsoDate(a.startDate).getTime() - parseIsoDate(b.startDate).getTime();
        return 0;
      });
  }, [projects, q, status, owner, sortKey]);

  const selected = projects.find((p) => p.id === selectedProjectId) ?? null;
  const open = Boolean(selectedProjectId);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search client, company, project…" />

        <Select value={status as string} onValueChange={(v) => setStatus(v as BusinessStatus | "All")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All statuses</SelectItem>
            {BUSINESS_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={owner as string} onValueChange={(v) => setOwner(v as SourceOwner | "All")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Owner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All owners</SelectItem>
            {SOURCE_OWNERS.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="startDate">Sort by start date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-x-auto border-zinc-200/70">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client / Company</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Current stage</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Blocked</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-10 text-center text-sm text-zinc-500">
                  No projects match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => <Row key={p.id} project={p} onOpen={() => selectProject(p.id)} />)
            )}
          </TableBody>
        </Table>
      </Card>

      <ProjectDetailsSheet project={selected} open={open} onOpenChange={(next) => selectProject(next ? selectedProjectId : null)} />
    </div>
  );
}

function Row({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const c = checklistCompletion(project);
  const stage = currentStageLabel(project);
  const overdue = isOverdue(project);
  const blocked = isBlocked(project);
  const invoicePaid = Boolean((project.checklist as Record<string, boolean>).invoicePaid);

  return (
    <TableRow className={overdue || blocked ? "bg-rose-50/30" : undefined}>
      <TableCell>
        <div className="min-w-[220px]">
          <div className="text-sm font-medium">{project.companyName}</div>
          <div className="text-xs text-zinc-500">{project.clientName}</div>
        </div>
      </TableCell>
      <TableCell>
        <div className="min-w-[240px]">
          <div className="text-sm font-medium">{project.projectName}</div>
          <div className="mt-1 flex items-center gap-2">
            <ServiceBadges project={project} />
            <Badge variant="outline">{c.percent}%</Badge>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge status={project.status} />
      </TableCell>
      <TableCell className="whitespace-nowrap">{formatShortDate(project.startDate)}</TableCell>
      <TableCell>
        <Badge variant="secondary" className="bg-white/70 border border-zinc-200 font-medium">
          {project.sourceOwner}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="max-w-[220px] truncate">
          {stage}
        </Badge>
      </TableCell>
      <TableCell>
        <ProjectProgressBar project={project} />
      </TableCell>
      <TableCell>
        {invoicePaid ? (
          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-50" variant="outline">
            Paid
          </Badge>
        ) : (
          <Badge variant="secondary">Unpaid</Badge>
        )}
      </TableCell>
      <TableCell>
        {blocked ? <Badge className="border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-50" variant="outline">Blocked</Badge> : "—"}
      </TableCell>
      <TableCell className="text-right">
        <Button variant="secondary" onClick={onOpen} className="rounded-xl">
          Open
        </Button>
      </TableCell>
    </TableRow>
  );
}

function ServiceBadges({ project }: { project: Project }) {
  const services = project.services ?? [];
  if (services.length === 0) return <Badge variant="secondary">{project.projectType}</Badge>;

  const order = { Web: 0, Design: 1, Marketing: 2 } as const;
  const sorted = [...services].sort((a, b) => order[a.category] - order[b.category] || a.name.localeCompare(b.name));

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {sorted.slice(0, 3).map((s) => (
        <Badge
          key={s.name}
          variant="outline"
          className={
            s.category === "Web"
              ? "border-zinc-200 bg-white"
              : s.category === "Design"
                ? "border-indigo-200 bg-indigo-50 text-indigo-900 hover:bg-indigo-50"
                : "border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-50"
          }
        >
          {s.name}
        </Badge>
      ))}
      {sorted.length > 3 ? <Badge variant="secondary">+{sorted.length - 3}</Badge> : null}
    </div>
  );
}

