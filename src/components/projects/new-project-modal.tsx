"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { BusinessStatus, Priority, ProjectType, SourceOwner } from "@/lib/projects/types";
import {
  BUSINESS_STATUSES,
  PRIORITIES,
  PROJECT_TYPES,
  SOURCE_OWNERS,
} from "@/lib/projects/types";
import { useProjectStore } from "@/lib/projects/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ServicePicker, type SelectedService } from "@/components/services/service-picker";

function dateToIso(dateStr: string): string {
  const d = new Date(`${dateStr}T09:00:00`);
  return d.toISOString();
}

export function NewProjectModal({ trigger }: { trigger: React.ReactNode }) {
  const router = useRouter();
  const { createProject } = useProjectStore();
  const [open, setOpen] = React.useState(false);

  const [clientName, setClientName] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [projectName, setProjectName] = React.useState("");
  const [projectType, setProjectType] = React.useState<ProjectType>("Corporate Website");
  const [services, setServices] = React.useState<SelectedService[]>([
    { name: "Website Development", category: "Web" },
  ]);
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

  function reset() {
    setClientName("");
    setCompanyName("");
    setProjectName("");
    setProjectType("Corporate Website");
    setServices([{ name: "Website Development", category: "Web" }]);
    setOwner("Team");
    setStatus("Lead");
    setStartDate("");
    setTargetEndDate("");
    setPriority("Medium");
    setNotes("");
  }

  function submit() {
    if (!canSubmit) return;
    createProject({
      category: "Website",
      clientName: clientName.trim(),
      companyName: companyName.trim(),
      projectName: projectName.trim(),
      projectType,
      services,
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
      checklist: {
        proposalPrepared: false,
        proposalSent: false,
        proposalAccepted: false,
        contractSent: false,
        contractSigned: false,
        invoiceSent: false,
        invoicePaid: false,
        designStarted: false,
        designApproved: false,
        developmentStarted: false,
        developmentCompleted: false,
        revisionsRequested: false,
        revisionsCompleted: false,
        deployed: false,
      },
    });
    setOpen(false);
    reset();
    router.push("/websites");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger className="contents">{trigger}</DialogTrigger>
      <DialogContent
        className={[
          // Mobile: full-bleed “sheet-like” dialog with scroll
          "h-[100dvh] w-[100vw] max-w-none rounded-none p-0",
          // Desktop: wider premium modal
          "sm:h-auto sm:w-[min(960px,calc(100vw-2rem))] sm:rounded-2xl",
          "overflow-hidden border-zinc-200 bg-white/70 backdrop-blur-xl",
        ].join(" ")}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key="new-project"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="max-h-[100dvh] overflow-y-auto p-5 sm:max-h-[85vh] sm:p-6"
          >
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-lg font-semibold tracking-tight">
                New project
              </DialogTitle>
              <div className="text-sm text-zinc-500">
                Create a project with a business status (flow) and clean scheduling. Execution checklist starts empty.
              </div>
            </DialogHeader>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field label="Client">
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Mila Petrova" />
              </Field>
              <Field label="Company">
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Zyntera Partner Co." />
              </Field>
              <div className="md:col-span-2">
                <Field label="Project name">
                  <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Brand + website redesign" />
                </Field>
              </div>
            </div>

            <Card className="mt-6 zyntera-card p-4">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Field label="Type">
                  <Select value={projectType} onValueChange={(v) => setProjectType(v as ProjectType)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROJECT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Owner">
                  <Select value={owner} onValueChange={(v) => setOwner(v as SourceOwner)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SOURCE_OWNERS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Status">
                  <Select value={status} onValueChange={(v) => setStatus(v as BusinessStatus)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BUSINESS_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Priority">
                  <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="mt-4">
                <Field label="Services">
                  <ServicePicker value={services} onChange={setServices} />
                </Field>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Start date">
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </Field>
                <Field label="Target end date">
                  <Input type="date" value={targetEndDate} onChange={(e) => setTargetEndDate(e.target.value)} />
                </Field>
              </div>
            </Card>

            <div className="mt-6">
              <Field label="Notes">
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[110px]" placeholder="Context, scope boundaries, constraints…" />
              </Field>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button onClick={submit} disabled={!canSubmit} className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-900/90">
                Create project
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-2">
      <Label className="text-xs font-medium text-zinc-500">{label}</Label>
      {children}
    </div>
  );
}

