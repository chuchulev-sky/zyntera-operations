"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServicePicker, type SelectedService as PickerService } from "@/components/services/service-picker";
import type { OfferCategory, OfferComplexity, OfferStatus } from "@/lib/offers/types";
import { OFFER_CATEGORIES, OFFER_COMPLEXITIES } from "@/lib/offers/types";
import { estimateOffer } from "@/lib/offers/estimation";

function formatEUR(value: number): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
  } catch {
    return `EUR ${Math.round(value).toLocaleString()}`;
  }
}

export function NewOfferModal({
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
  const router = useRouter();
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
  const [category, setCategory] = React.useState<OfferCategory>("Website");
  const [complexity, setComplexity] = React.useState<OfferComplexity>("Medium");
  const [services, setServices] = React.useState<PickerService[]>([{ name: "Website Development", category: "Web" }]);
  const [notes, setNotes] = React.useState("");
  const [status, setStatus] = React.useState<OfferStatus>("Draft");
  const [suggestedPriceOverride, setSuggestedPriceOverride] = React.useState<string>("");
  const [estimatedHoursOverride, setEstimatedHoursOverride] = React.useState<string>("");
  const [timelineDaysOverride, setTimelineDaysOverride] = React.useState<string>("");
  const [workloadDevOverride, setWorkloadDevOverride] = React.useState<string>("");
  const [workloadMarketingOverride, setWorkloadMarketingOverride] = React.useState<string>("");

  const est = React.useMemo(
    () =>
      estimateOffer({
        category,
        complexity,
        selectedServices: services,
      }),
    [category, complexity, services]
  );

  const suggestedPrice = React.useMemo(() => {
    const n = Number(suggestedPriceOverride);
    if (suggestedPriceOverride.trim() !== "" && !Number.isNaN(n)) return n;
    return est.suggestedPrice;
  }, [suggestedPriceOverride, est.suggestedPrice]);

  const estimatedHours = React.useMemo(() => {
    const n = Number(estimatedHoursOverride);
    if (estimatedHoursOverride.trim() !== "" && !Number.isNaN(n)) return n;
    return est.estimatedHoursTotal;
  }, [estimatedHoursOverride, est.estimatedHoursTotal]);

  const estimatedTimelineDays = React.useMemo(() => {
    const n = Number(timelineDaysOverride);
    if (timelineDaysOverride.trim() !== "" && !Number.isNaN(n)) return n;
    return est.estimatedTimelineDays;
  }, [timelineDaysOverride, est.estimatedTimelineDays]);

  const workloadDev = React.useMemo(() => {
    const n = Number(workloadDevOverride);
    if (workloadDevOverride.trim() !== "" && !Number.isNaN(n)) return n;
    return est.workloadByDepartment.Development ?? 0;
  }, [workloadDevOverride, est.workloadByDepartment.Development]);

  const workloadMarketing = React.useMemo(() => {
    const n = Number(workloadMarketingOverride);
    if (workloadMarketingOverride.trim() !== "" && !Number.isNaN(n)) return n;
    return est.workloadByDepartment.Marketing ?? 0;
  }, [workloadMarketingOverride, est.workloadByDepartment.Marketing]);

  const canSubmit = clientName.trim() && companyName.trim() && projectName.trim() && services.length > 0;

  function reset() {
    setClientName("");
    setCompanyName("");
    setProjectName("");
    setCategory("Website");
    setComplexity("Medium");
    setServices([{ name: "Website Development", category: "Web" }]);
    setNotes("");
    setStatus("Draft");
    setSuggestedPriceOverride("");
    setEstimatedHoursOverride("");
    setTimelineDaysOverride("");
    setWorkloadDevOverride("");
    setWorkloadMarketingOverride("");
  }

  async function submit() {
    if (!canSubmit) return;
    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        clientName: clientName.trim(),
        companyName: companyName.trim(),
        projectName: projectName.trim(),
        category,
        complexity,
        selectedServices: services,
        notes: notes.trim(),
        status,
        suggestedPrice,
        estimatedHours,
        estimatedTimelineDays,
        workloadByDepartment: {
          Development: workloadDev,
          Marketing: workloadMarketing,
        },
        manual: true,
      }),
    });
    if (!res.ok) throw new Error("Failed to create offer");
    setOpen(false);
    reset();
    onCreated?.();
    router.push("/offers");
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
          // Override DialogContent's default `sm:max-w-sm` with an explicit max width.
          "sm:h-auto sm:w-full sm:max-w-[min(1400px,calc(100vw-2rem))] sm:rounded-2xl",
          "overflow-hidden border-zinc-200 bg-white/70 backdrop-blur-xl",
        ].join(" ")}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key="new-offer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="max-h-[100dvh] overflow-y-auto p-5 sm:max-h-[85vh] sm:p-6"
          >
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-lg font-semibold tracking-tight">New offer</DialogTitle>
              <div className="text-sm text-zinc-500">
                Estimate first. Convert to a commitment only after approval.
              </div>
            </DialogHeader>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field label="Client">
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Kiril Stanilov" />
              </Field>
              <Field label="Company">
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Stanilov Clima" />
              </Field>
              <div className="md:col-span-2">
                <Field label="Project name">
                  <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Marketing retainer setup" />
                </Field>
              </div>
            </div>

            <Card className="mt-6 zyntera-card p-4">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Field label="Category">
                  <Select value={category} onValueChange={(v) => setCategory(v as OfferCategory)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OFFER_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Complexity">
                  <Select value={complexity} onValueChange={(v) => setComplexity(v as OfferComplexity)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OFFER_COMPLEXITIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Status">
                  <Select value={status} onValueChange={(v) => setStatus(v as OfferStatus)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Sent">Sent</SelectItem>
                      <SelectItem value="Accepted">Accepted</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Suggested price">
                  <Input
                    inputMode="numeric"
                    value={suggestedPriceOverride}
                    onChange={(e) => setSuggestedPriceOverride(e.target.value)}
                    placeholder={formatEUR(est.suggestedPrice)}
                  />
                </Field>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Field label="Estimated hours">
                  <Input
                    inputMode="numeric"
                    value={estimatedHoursOverride}
                    onChange={(e) => setEstimatedHoursOverride(e.target.value)}
                    placeholder={`${est.estimatedHoursTotal}`}
                  />
                </Field>
                <Field label="Timeline (days)">
                  <Input
                    inputMode="numeric"
                    value={timelineDaysOverride}
                    onChange={(e) => setTimelineDaysOverride(e.target.value)}
                    placeholder={`${est.estimatedTimelineDays}`}
                  />
                </Field>
                <Field label="Workload (dev)">
                  <Input
                    inputMode="numeric"
                    value={workloadDevOverride}
                    onChange={(e) => setWorkloadDevOverride(e.target.value)}
                    placeholder={`${est.workloadByDepartment.Development ?? 0}`}
                  />
                </Field>
                <Field label="Workload (marketing)">
                  <Input
                    inputMode="numeric"
                    value={workloadMarketingOverride}
                    onChange={(e) => setWorkloadMarketingOverride(e.target.value)}
                    placeholder={`${est.workloadByDepartment.Marketing ?? 0}`}
                  />
                </Field>
              </div>

              <div className="mt-4">
                <Field label="Services">
                  <ServicePicker
                    value={services}
                    onChange={(next) => {
                      setServices(next);
                      // Keep category aligned if user picks only marketing services.
                      if (next.length && next.every((s) => s.category === "Marketing")) setCategory("Marketing");
                      if (next.length && next.some((s) => s.category !== "Marketing")) setCategory("Website");
                    }}
                  />
                </Field>
              </div>
            </Card>

            <div className="mt-6">
              <Field label="Notes">
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[110px]" placeholder="Scope, assumptions, boundaries…" />
              </Field>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button
                onClick={() => void submit()}
                disabled={!canSubmit}
                className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-900/90"
              >
                Create offer
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

