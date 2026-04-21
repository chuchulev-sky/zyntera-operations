"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BusinessStatus, Priority, ProjectType, SourceOwner } from "@/lib/projects/types";
import {
  BUSINESS_STATUSES,
  PRIORITIES,
  PROJECT_TYPES,
  SOURCE_OWNERS,
} from "@/lib/projects/types";
import { useProjectStore } from "@/lib/projects/store";
import { SERVICE_CATALOG } from "@/lib/services/catalog";

function dateToIso(dateStr: string): string {
  // dateStr from <input type="date"> is YYYY-MM-DD (local); store as ISO string.
  const d = new Date(`${dateStr}T09:00:00`);
  return d.toISOString();
}

export default function NewProjectPage() {
  const router = useRouter();
  const { createProject } = useProjectStore();

  const [clientName, setClientName] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [projectName, setProjectName] = React.useState("");
  const [projectType, setProjectType] = React.useState<ProjectType>("Corporate Website");
  const [owner, setOwner] = React.useState<SourceOwner>("Team");
  const [status, setStatus] = React.useState<BusinessStatus>("Lead");
  const [startDate, setStartDate] = React.useState("");
  const [targetEndDate, setTargetEndDate] = React.useState("");
  const [priority, setPriority] = React.useState<Priority>("Medium");
  const [notes, setNotes] = React.useState("");

  const canSubmit =
    clientName.trim() &&
    companyName.trim() &&
    projectName.trim() &&
    startDate.trim() &&
    targetEndDate.trim();

  function submit() {
    if (!canSubmit) return;
    createProject({
      category: "Website",
      clientName: clientName.trim(),
      companyName: companyName.trim(),
      projectName: projectName.trim(),
      projectType,
      services: SERVICE_CATALOG.filter((s) => s.name === "Website Development"),
      sourceOwner: owner,
      status,
      startDate: dateToIso(startDate),
      targetEndDate: dateToIso(targetEndDate),
      priority,
      notes: notes.trim(),
      isArchived: false,
      proposalAmount: 0,
      agreedAmount: 0,
      invoicedAmount: 0,
      paidAmount: 0,
      currency: "EUR",
      paymentStatus: "Unpaid",
    });
    router.push("/websites");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New project</h1>
          <p className="text-sm text-zinc-500">Create a project with business status + scheduling. Checklist progress starts empty.</p>
        </div>
        <Badge variant="secondary">Mock data</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Client name</Label>
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Mila Petrova" />
            </div>
            <div className="space-y-2">
              <Label>Company name</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Bloom Dental Studio" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Project name</Label>
              <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. New marketing website" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Project type</Label>
              <Select value={projectType} onValueChange={(v) => setProjectType(v as ProjectType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Owner</Label>
              <Select value={owner} onValueChange={(v) => setOwner(v as SourceOwner)}>
                <SelectTrigger>
                  <SelectValue placeholder="Owner" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OWNERS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as BusinessStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Start date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Target end date</Label>
              <Input type="date" value={targetEndDate} onChange={(e) => setTargetEndDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Key constraints, scope notes, important context…" className="min-h-[120px]" />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => router.push("/projects")}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!canSubmit}>
              Create project
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

