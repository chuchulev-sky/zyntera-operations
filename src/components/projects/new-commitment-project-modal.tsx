"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServicePicker, type SelectedService as PickerService } from "@/components/services/service-picker";
import type { CommitmentProject, PaymentStatus, WorkloadStatus } from "@/lib/commitments/types";
import { PAYMENT_STATUSES, WORKLOAD_STATUSES } from "@/lib/commitments/types";
import { ProjectCapacityHelper } from "@/components/projects/project-capacity-helper";

function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + delta);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isoDateInputValue(iso: string): string {
  return iso.slice(0, 10);
}

export function NewCommitmentProjectModal({
  trigger,
  onCreated,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: {
  trigger?: React.ReactNode;
  onCreated?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = React.useCallback(
    (next: boolean) => {
      onOpenChangeProp?.(next);
      setInternalOpen(next);
    },
    [onOpenChangeProp]
  );

  const [clientName, setClientName] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [projectName, setProjectName] = React.useState("");
  const [category, setCategory] = React.useState<CommitmentProject["category"]>("Website");
  const [services, setServices] = React.useState<PickerService[]>([{ name: "Website Development", category: "Web" }]);
  const [startDate, setStartDate] = React.useState(() => startOfWeekMonday(new Date()).toISOString());
  const [targetEndDate, setTargetEndDate] = React.useState(() => addDays(startOfWeekMonday(new Date()), 13).toISOString());
  const [estimatedHours, setEstimatedHours] = React.useState("0");
  const [committedHours, setCommittedHours] = React.useState("0");
  const [priceTotal, setPriceTotal] = React.useState("0");
  const [paymentStatus, setPaymentStatus] = React.useState<PaymentStatus>("Retainer");
  const [workloadStatus, setWorkloadStatus] = React.useState<WorkloadStatus>("Healthy");
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const canSubmit = clientName.trim() && companyName.trim() && projectName.trim();

  function reset() {
    setClientName("");
    setCompanyName("");
    setProjectName("");
    setCategory("Website");
    setServices([{ name: "Website Development", category: "Web" }]);
    setStartDate(startOfWeekMonday(new Date()).toISOString());
    setTargetEndDate(addDays(startOfWeekMonday(new Date()), 13).toISOString());
    setEstimatedHours("0");
    setCommittedHours("0");
    setPriceTotal("0");
    setPaymentStatus("Retainer");
    setWorkloadStatus("Healthy");
    setNotes("");
    setError(null);
  }

  async function submit() {
    if (!canSubmit) return;
    setError(null);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        origin: "Manual",
        offerId: null,
        clientName: clientName.trim(),
        companyName: companyName.trim(),
        projectName: projectName.trim(),
        category,
        selectedServices: services,
        startDate,
        targetEndDate,
        estimatedHours: Number(estimatedHours || 0),
        committedHours: Number(committedHours || 0),
        priceTotal: Number(priceTotal || 0),
        currency: "EUR",
        paymentStatus,
        workloadStatus,
        notes: notes.trim(),
      } satisfies Partial<CommitmentProject>),
    });
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as any;
      const attempted = json?.attempted?.payment_status ? ` (attempted: ${json.attempted.payment_status})` : "";
      const actionable = json?.actionable ? `\n${json.actionable}` : "";
      setError((json?.error ?? "Failed to create project") + attempted + actionable);
      return;
    }
    setOpen(false);
    reset();
    onCreated?.();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      {trigger ? <DialogTrigger className="contents">{trigger}</DialogTrigger> : null}
      <DialogContent
        className={[
          "h-[100dvh] w-[100vw] max-w-none rounded-none p-0",
          "sm:h-auto sm:w-full sm:max-w-[min(1400px,calc(100vw-2rem))] sm:rounded-2xl",
          "overflow-hidden border-zinc-200 bg-white/70 backdrop-blur-xl",
        ].join(" ")}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key="new-commitment"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="max-h-[100dvh] overflow-y-auto p-5 sm:max-h-[85vh] sm:p-6"
          >
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-lg font-semibold tracking-tight">Add project</DialogTitle>
              <div className="text-sm text-zinc-500">Create a commitment directly (origin: Manual).</div>
            </DialogHeader>
            {error ? (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                {error}
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field label="Client">
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
              </Field>
              <Field label="Company">
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Project name">
                  <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                </Field>
              </div>
            </div>

            <Card className="mt-6 zyntera-card p-4">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Field label="Category">
                  <Select value={category} onValueChange={(v) => setCategory(v as CommitmentProject["category"])}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Website">Website</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Payment status">
                  <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as PaymentStatus)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Workload status">
                  <Select value={workloadStatus} onValueChange={(v) => setWorkloadStatus(v as WorkloadStatus)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORKLOAD_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Field label="Start date">
                  <Input
                    type="date"
                    value={isoDateInputValue(startDate)}
                    onChange={(e) => setStartDate(new Date(`${e.target.value}T09:00:00`).toISOString())}
                  />
                </Field>
                <Field label="Target end date">
                  <Input
                    type="date"
                    value={isoDateInputValue(targetEndDate)}
                    onChange={(e) => setTargetEndDate(new Date(`${e.target.value}T09:00:00`).toISOString())}
                  />
                </Field>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Field label="Estimated hours">
                  <Input inputMode="numeric" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} />
                </Field>
                <Field label="Committed hours">
                  <Input inputMode="numeric" value={committedHours} onChange={(e) => setCommittedHours(e.target.value)} />
                </Field>
                <Field label="Revenue (EUR)">
                  <Input inputMode="numeric" value={priceTotal} onChange={(e) => setPriceTotal(e.target.value)} />
                </Field>
              </div>

              <div className="mt-4">
                <Field label="Services">
                  <ServicePicker value={services} onChange={setServices} />
                </Field>
              </div>
            </Card>

            <div className="mt-4">
              <ProjectCapacityHelper
                open={open}
                category={category}
                estimatedHours={Number(estimatedHours || 0)}
              />
            </div>

            <div className="mt-6">
              <Field label="Notes">
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[110px]" />
              </Field>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button disabled={!canSubmit} onClick={() => void submit()} className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-900/90">
                Add project
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

