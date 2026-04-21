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
import type { Offer, OfferCategory, OfferComplexity, OfferStatus } from "@/lib/offers/types";
import { OFFER_CATEGORIES, OFFER_COMPLEXITIES, OFFER_STATUSES } from "@/lib/offers/types";
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

export function EditOfferModal({
  trigger,
  offer,
  onSaved,
}: {
  trigger: React.ReactNode;
  offer: Offer;
  onSaved?: () => void;
}) {
  const [open, setOpen] = React.useState(false);

  const [clientName, setClientName] = React.useState(offer.clientName);
  const [companyName, setCompanyName] = React.useState(offer.companyName);
  const [projectName, setProjectName] = React.useState(offer.projectName);
  const [category, setCategory] = React.useState<OfferCategory>(offer.category);
  const [complexity, setComplexity] = React.useState<OfferComplexity>(offer.complexity);
  const [services, setServices] = React.useState<PickerService[]>(offer.selectedServices ?? []);
  const [notes, setNotes] = React.useState(offer.notes ?? "");
  const [status, setStatus] = React.useState<OfferStatus>(offer.status);

  const [suggestedPrice, setSuggestedPrice] = React.useState(String(offer.suggestedPrice ?? 0));
  const [estimatedHours, setEstimatedHours] = React.useState(String(offer.estimatedHours ?? 0));
  const [timelineDays, setTimelineDays] = React.useState(String(offer.estimatedTimelineDays ?? 0));
  const [workloadDev, setWorkloadDev] = React.useState(String(offer.workloadByDepartment?.Development ?? 0));
  const [workloadMarketing, setWorkloadMarketing] = React.useState(String(offer.workloadByDepartment?.Marketing ?? 0));

  function resetFromOffer() {
    setClientName(offer.clientName);
    setCompanyName(offer.companyName);
    setProjectName(offer.projectName);
    setCategory(offer.category);
    setComplexity(offer.complexity);
    setServices(offer.selectedServices ?? []);
    setNotes(offer.notes ?? "");
    setStatus(offer.status);
    setSuggestedPrice(String(offer.suggestedPrice ?? 0));
    setEstimatedHours(String(offer.estimatedHours ?? 0));
    setTimelineDays(String(offer.estimatedTimelineDays ?? 0));
    setWorkloadDev(String(offer.workloadByDepartment?.Development ?? 0));
    setWorkloadMarketing(String(offer.workloadByDepartment?.Marketing ?? 0));
  }

  async function save() {
    const res = await fetch(`/api/offers/${offer.id}`, {
      method: "PATCH",
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
        suggestedPrice: Number(suggestedPrice || 0),
        estimatedHours: Number(estimatedHours || 0),
        estimatedTimelineDays: Number(timelineDays || 0),
        workloadByDepartment: {
          Development: Number(workloadDev || 0),
          Marketing: Number(workloadMarketing || 0),
        },
        manual: true,
      }),
    });
    if (!res.ok) throw new Error("Failed to update offer");
    setOpen(false);
    onSaved?.();
  }

  async function del() {
    const res = await fetch(`/api/offers/${offer.id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) throw new Error("Failed to delete offer");
    setOpen(false);
    onSaved?.();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) resetFromOffer();
      }}
    >
      <DialogTrigger className="contents">{trigger}</DialogTrigger>
      <DialogContent
        className={[
          "h-[100dvh] w-[100vw] max-w-none rounded-none p-0",
          "sm:h-auto sm:w-full sm:max-w-[min(1400px,calc(100vw-2rem))] sm:rounded-2xl",
          "overflow-hidden border-zinc-200 bg-white/70 backdrop-blur-xl",
        ].join(" ")}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key="edit-offer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="max-h-[100dvh] overflow-y-auto p-5 sm:max-h-[85vh] sm:p-6"
          >
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-lg font-semibold tracking-tight">Edit offer</DialogTitle>
              <div className="text-sm text-zinc-500">Manual stage: edit the numbers and scope directly.</div>
            </DialogHeader>

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
                      {OFFER_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Suggested price">
                  <Input inputMode="numeric" value={suggestedPrice} onChange={(e) => setSuggestedPrice(e.target.value)} />
                </Field>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Field label="Estimated hours">
                  <Input inputMode="numeric" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} />
                </Field>
                <Field label="Timeline (days)">
                  <Input inputMode="numeric" value={timelineDays} onChange={(e) => setTimelineDays(e.target.value)} />
                </Field>
                <Field label="Workload (dev)">
                  <Input inputMode="numeric" value={workloadDev} onChange={(e) => setWorkloadDev(e.target.value)} />
                </Field>
                <Field label="Workload (marketing)">
                  <Input inputMode="numeric" value={workloadMarketing} onChange={(e) => setWorkloadMarketing(e.target.value)} />
                </Field>
              </div>

              <div className="mt-4">
                <Field label="Services">
                  <ServicePicker value={services} onChange={setServices} />
                </Field>
              </div>
            </Card>

            <div className="mt-6">
              <Field label="Notes">
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[110px]" />
              </Field>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <AlertDialog>
                <AlertDialogTrigger render={<Button variant="destructive" className="rounded-xl" />}>Delete</AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete offer?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the offer. Any linked commitment projects will keep working (their offer link will be cleared).
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => void del()}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button onClick={() => void save()} className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-900/90">
                Save changes
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

