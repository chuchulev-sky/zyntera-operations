"use client";

import * as React from "react";
import type { BusinessStatus, Priority, Project, ProjectType, SourceOwner } from "@/lib/projects/types";
import { useProjectStore } from "@/lib/projects/store";
import {
  checklistCompletion,
  currentStageLabel,
  formatShortDate,
  isBlocked,
  isOverdue,
} from "@/lib/projects/helpers";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChecklistList } from "@/components/projects/checklist";
import { PriorityBadge, StatusBadge } from "@/components/projects/project-badges";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BUSINESS_STATUSES, PRIORITIES, PROJECT_TYPES, SOURCE_OWNERS } from "@/lib/projects/types";
import { ServicePicker, type SelectedService } from "@/components/services/service-picker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ProjectDetailsSheet({
  project,
  open,
  onOpenChange,
}: {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toggleChecklist, updateProject, addNote, deleteProject, selectProject } = useProjectStore();
  const [note, setNote] = React.useState("");
  const [pendingFinancial, setPendingFinancial] = React.useState<{
    label: string;
    patch: Partial<Project>;
  } | null>(null);

  React.useEffect(() => {
    setNote("");
  }, [project?.id]);

  if (!project) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[520px] sm:max-w-[520px]">
          <div className="text-sm text-zinc-600">No project selected.</div>
        </SheetContent>
      </Sheet>
    );
  }

  const p = project;
  const completion = checklistCompletion(p);
  const stage = currentStageLabel(p);
  const overdue = isOverdue(p);
  const blocked = isBlocked(p);

  function isoToDateInput(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function dateInputToIso(dateStr: string): string {
    // input gives YYYY-MM-DD in local time; store as ISO.
    const d = new Date(`${dateStr}T09:00:00`);
    return d.toISOString();
  }

  function setBlockedReason(next: string) {
    updateProject(p.id, { blockedReason: next });
  }

  function toggle(key: string) {
    toggleChecklist(p.id, key);
  }

  function submitNote() {
    const body = note.trim();
    if (!body) return;
    addNote(p.id, "Internal", body);
    setNote("");
  }

  const statusLock =
    p.status === "Completed"
      ? "locked"
      : p.status === "In Progress"
        ? "restricted"
        : p.status === "Won" || p.status === "Scheduled"
          ? "partial"
          : "open";

  const readOnlyAll = statusLock === "locked";
  const restrictCore = statusLock === "restricted" || statusLock === "locked";
  const financialNeedsConfirm = statusLock === "partial";

  function setFinancialWithConfirm(label: string, patch: Partial<Project>) {
    if (readOnlyAll) return;
    if (!financialNeedsConfirm) return updateProject(p.id, patch);
    setPendingFinancial({ label, patch });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) selectProject(null);
      }}
    >
      <SheetContent className="w-[520px] space-y-6 sm:max-w-[520px]">
        <SheetHeader>
          <SheetTitle className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-base font-semibold">{p.projectName}</div>
              <div className="truncate text-sm font-normal text-zinc-500">
                {p.companyName} • {p.clientName}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <StatusBadge status={p.status} />
              <div className="flex items-center gap-2">
                {overdue ? (
                  <Badge className="bg-rose-600 text-white hover:bg-rose-600">Overdue</Badge>
                ) : null}
                {blocked ? (
                  <Badge className="bg-amber-600 text-white hover:bg-amber-600">Blocked</Badge>
                ) : null}
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="rounded-xl border bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={p.priority} />
            <Badge variant="secondary">{p.projectType}</Badge>
            <Badge variant="outline">{stage}</Badge>
          </div>
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
              <span>Checklist completion</span>
              <span>
                {completion.done}/{completion.total} • {completion.percent}%
              </span>
            </div>
            <Progress value={completion.percent} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border bg-zinc-50 p-3">
              <div className="text-xs text-zinc-500">Business status</div>
              <div className="mt-2">
                <Select
                  value={p.status}
                  onValueChange={(v) => updateProject(p.id, { status: v as BusinessStatus })}
                  disabled={readOnlyAll}
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue />
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
            </div>
            <div className="rounded-lg border bg-zinc-50 p-3">
              <div className="text-xs text-zinc-500">Priority</div>
              <div className="mt-2">
                <Select
                  value={p.priority}
                  onValueChange={(v) => updateProject(p.id, { priority: v as Priority })}
                  disabled={readOnlyAll}
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((pr) => (
                      <SelectItem key={pr} value={pr}>
                        {pr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="rounded-lg border bg-zinc-50 p-3">
              <div className="text-xs text-zinc-500">Owner</div>
              <div className="mt-2">
                <Select
                  value={p.sourceOwner}
                  onValueChange={(v) => updateProject(p.id, { sourceOwner: v as SourceOwner })}
                  disabled={readOnlyAll}
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue />
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
            </div>
            <div className="rounded-lg border bg-zinc-50 p-3">
              <div className="text-xs text-zinc-500">Start date</div>
              <div className="mt-2">
                <Input
                  type="date"
                  value={isoToDateInput(p.startDate)}
                  onChange={(e) => updateProject(p.id, { startDate: dateInputToIso(e.target.value) })}
                  className="bg-white"
                  disabled={restrictCore}
                />
              </div>
              <div className="mt-2 text-xs text-zinc-500">Shown: {formatShortDate(p.startDate)}</div>
            </div>
            <div className="rounded-lg border bg-zinc-50 p-3">
              <div className="text-xs text-zinc-500">Target end</div>
              <div className="mt-2">
                <Input
                  type="date"
                  value={isoToDateInput(p.targetEndDate)}
                  onChange={(e) => updateProject(p.id, { targetEndDate: dateInputToIso(e.target.value) })}
                  className="bg-white"
                  disabled={readOnlyAll}
                />
              </div>
              <div className="mt-2 text-xs text-zinc-500">Shown: {formatShortDate(p.targetEndDate)}</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold">Project info</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-500">Client</Label>
              <Input
                value={p.clientName}
                onChange={(e) => updateProject(p.id, { clientName: e.target.value })}
                disabled={restrictCore}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-zinc-500">Company</Label>
              <Input
                value={p.companyName}
                onChange={(e) => updateProject(p.id, { companyName: e.target.value })}
                disabled={restrictCore}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs text-zinc-500">Project name</Label>
              <Input
                value={p.projectName}
                onChange={(e) => updateProject(p.id, { projectName: e.target.value })}
                disabled={readOnlyAll}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs text-zinc-500">Project type</Label>
              <Select
                value={p.projectType}
                onValueChange={(v) => updateProject(p.id, { projectType: v as ProjectType })}
                disabled={readOnlyAll}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
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
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs text-zinc-500">Services</Label>
              <ServicePicker
                value={(p.services ?? []) as SelectedService[]}
                onChange={(next) => (readOnlyAll ? null : updateProject(p.id, { services: next }))}
              />
              {readOnlyAll ? <div className="text-xs text-zinc-500">Completed projects are read-only.</div> : null}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold">Execution checklist</div>
          <ChecklistList project={p} onToggle={toggle} />
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold">Blocked reason</div>
          <Textarea
            value={p.blockedReason ?? ""}
            onChange={(e) => setBlockedReason(e.target.value)}
            placeholder="If blocked, add the reason (e.g. waiting on assets, payment, approvals)."
            className="min-h-[88px]"
            disabled={readOnlyAll}
          />
          <div className="text-xs text-zinc-500">
            Tip: keep business status “Scheduled” separate from “In Progress” to avoid overload.
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold">Commercial</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-zinc-50 p-3">
              <div className="text-xs text-zinc-500">Proposal</div>
              <Input
                type="number"
                inputMode="decimal"
                value={p.proposalAmount}
                onChange={(e) => setFinancialWithConfirm("Proposal amount", { proposalAmount: Number(e.target.value || 0) })}
                className="mt-2 bg-white"
                disabled={restrictCore}
              />
            </div>
            <div className="rounded-lg border bg-zinc-50 p-3">
              <div className="text-xs text-zinc-500">Agreed</div>
              <Input
                type="number"
                inputMode="decimal"
                value={p.agreedAmount}
                onChange={(e) => setFinancialWithConfirm("Agreed amount", { agreedAmount: Number(e.target.value || 0) })}
                className="mt-2 bg-white"
                disabled={restrictCore}
              />
            </div>
            <div className="rounded-lg border bg-zinc-50 p-3">
              <div className="text-xs text-zinc-500">Invoiced</div>
              <Input
                type="number"
                inputMode="decimal"
                value={p.invoicedAmount}
                onChange={(e) => setFinancialWithConfirm("Invoiced amount", { invoicedAmount: Number(e.target.value || 0) })}
                className="mt-2 bg-white"
                disabled={readOnlyAll}
              />
            </div>
            <div className="rounded-lg border bg-zinc-50 p-3">
              <div className="text-xs text-zinc-500">Paid</div>
              <Input
                type="number"
                inputMode="decimal"
                value={p.paidAmount}
                onChange={(e) => setFinancialWithConfirm("Paid amount", { paidAmount: Number(e.target.value || 0) })}
                className="mt-2 bg-white"
                disabled={readOnlyAll}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-zinc-50 p-3">
              <div className="text-xs text-zinc-500">Currency</div>
              <Input
                value={p.currency}
                onChange={(e) => updateProject(p.id, { currency: e.target.value.toUpperCase().slice(0, 3) })}
                className="mt-2 bg-white"
                placeholder="EUR"
                disabled={readOnlyAll}
              />
            </div>
            <div className="rounded-lg border bg-zinc-50 p-3">
              <div className="text-xs text-zinc-500">Payment status</div>
              <Select
                value={p.paymentStatus}
                onValueChange={(v) => updateProject(p.id, { paymentStatus: v as Project["paymentStatus"] })}
                disabled={readOnlyAll}
              >
                <SelectTrigger className="mt-2 w-full bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                  <SelectItem value="Partial">Partial</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="text-xs text-zinc-500">
            Revenue is derived automatically from these fields + marketing monthly payments (not entered separately).
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold">Internal notes</div>
          <Textarea
            value={p.notes}
            onChange={(e) => updateProject(p.id, { notes: e.target.value })}
            placeholder="Internal context, scope boundaries, constraints…"
            className="min-h-[100px]"
            disabled={readOnlyAll}
          />
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Notes & activity</div>
          </div>
          <div className="space-y-2">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note (internal)."
              className="min-h-[80px]"
              disabled={readOnlyAll}
            />
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setNote("")} disabled={!note.trim()}>
                Clear
              </Button>
              <Button onClick={submitNote} disabled={!note.trim()}>
                Add note
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {p.activity.length === 0 ? (
              <div className="rounded-lg border bg-white p-3 text-sm text-zinc-600">
                No activity yet.
              </div>
            ) : (
              p.activity.map((n) => (
                <div key={n.id} className="rounded-lg border bg-white p-3">
                  <div className="flex items-center justify-between gap-3 text-xs text-zinc-500">
                    <span className="font-medium text-zinc-700">{n.author}</span>
                    <span>{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">{n.body}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            Updated {new Date(p.updatedAt).toLocaleString()}
          </div>
          <AlertDialog>
            <AlertDialogTrigger
              className={cn(buttonVariants({ variant: "destructive" }))}
            >
              Archive
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archive this project?</AlertDialogTitle>
                <AlertDialogDescription>
                  The project will be archived and hidden from active views. You can restore it later via database tools.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    deleteProject(p.id);
                    onOpenChange(false);
                  }}
                  className="bg-rose-600 text-white hover:bg-rose-600"
                >
                  Archive
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <AlertDialog open={Boolean(pendingFinancial)} onOpenChange={(o) => (o ? null : setPendingFinancial(null))}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm financial edit</AlertDialogTitle>
              <AlertDialogDescription>
                This project is <span className="font-medium text-zinc-900">{p.status}</span>. Financial overwrites require confirmation to avoid accidental changes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingFinancial(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (!pendingFinancial) return;
                  updateProject(p.id, pendingFinancial.patch);
                  setPendingFinancial(null);
                }}
                className="bg-zinc-900 text-white hover:bg-zinc-900/90"
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}

