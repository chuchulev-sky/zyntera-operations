"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServicePicker, type SelectedService } from "@/components/services/service-picker";
import type { MarketingClientStatus, MarketingService } from "@/lib/marketing/types";
import { estimateMarketingRetainer } from "@/lib/marketing/estimates";
import { useProjectStore } from "@/lib/projects/store";

function formatEUR(value: number): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
  } catch {
    return `EUR ${Math.round(value).toLocaleString()}`;
  }
}

export function NewMarketingClientModal({
  trigger,
  initialClientName,
  initialServices,
}: {
  trigger: React.ReactNode;
  initialClientName?: string;
  initialServices?: MarketingService[];
}) {
  const { createMarketingClient } = useProjectStore();
  const [open, setOpen] = React.useState(false);

  const [clientName, setClientName] = React.useState(initialClientName ?? "");
  const [services, setServices] = React.useState<SelectedService[]>(
    (initialServices ?? []).map((s) => ({ name: s, category: "Marketing" }))
  );
  const [creativesPerMonth, setCreativesPerMonth] = React.useState<number>(0);
  const [monthlyFee, setMonthlyFee] = React.useState<number>(0);
  const [netAmount, setNetAmount] = React.useState<number>(0);
  const [owner, setOwner] = React.useState<"Peter" | "Krasi" | "Team">("Team");
  const [status, setStatus] = React.useState<MarketingClientStatus>("Active");

  const marketingServices = React.useMemo(
    () => services.filter((s) => s.category === "Marketing").map((s) => s.name) as MarketingService[],
    [services]
  );

  const suggestion = React.useMemo(
    () => estimateMarketingRetainer(marketingServices, creativesPerMonth),
    [marketingServices, creativesPerMonth]
  );

  React.useEffect(() => {
    if (!open) return;
    // If user hasn’t typed anything yet, keep fields synced to the latest suggestion.
    if (monthlyFee === 0) setMonthlyFee(suggestion.monthlyFeeEUR);
    if (netAmount === 0) setNetAmount(suggestion.monthlyFeeEUR);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, suggestion.monthlyFeeEUR]);

  const canSubmit = clientName.trim().length > 0 && marketingServices.length > 0;

  function reset() {
    setClientName(initialClientName ?? "");
    setServices((initialServices ?? []).map((s) => ({ name: s, category: "Marketing" })));
    setCreativesPerMonth(0);
    setMonthlyFee(0);
    setNetAmount(0);
    setOwner("Team");
    setStatus("Active");
  }

  async function submit() {
    if (!canSubmit) return;
    await createMarketingClient({
      clientName: clientName.trim(),
      services: marketingServices,
      monthlyFee,
      netAmount,
      creativesPerMonth,
      owner,
      status,
    });
    setOpen(false);
    reset();
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
          "h-[100dvh] w-[100vw] max-w-none rounded-none p-0",
          "sm:h-auto sm:w-[min(960px,calc(100vw-2rem))] sm:rounded-2xl",
          "overflow-hidden border-zinc-200 bg-white/70 backdrop-blur-xl",
        ].join(" ")}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key="new-marketing-client"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="max-h-[100dvh] overflow-y-auto p-5 sm:max-h-[85vh] sm:p-6"
          >
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-lg font-semibold tracking-tight">New marketing client</DialogTitle>
              <div className="text-sm text-zinc-500">
                Pick the services you provide. We’ll estimate monthly effort and suggest a fee you can override.
              </div>
            </DialogHeader>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field label="Client">
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Kiril Stanilov" />
              </Field>
              <Field label="Owner">
                <Select value={owner} onValueChange={(v) => setOwner(v as typeof owner)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Peter">Peter</SelectItem>
                    <SelectItem value="Krasi">Krasi</SelectItem>
                    <SelectItem value="Team">Team</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Card className="mt-6 zyntera-card p-4">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Field label="Status">
                  <Select value={status} onValueChange={(v) => setStatus(v as MarketingClientStatus)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Creatives / month">
                  <Input
                    inputMode="numeric"
                    value={String(creativesPerMonth)}
                    onChange={(e) => setCreativesPerMonth(Number(e.target.value || 0))}
                  />
                </Field>
                <Field label="Suggested hours / month">
                  <Input value={`${suggestion.hoursPerMonth}`} readOnly />
                </Field>
                <Field label="Suggested fee">
                  <Input value={formatEUR(suggestion.monthlyFeeEUR)} readOnly />
                </Field>
              </div>

              <div className="mt-4">
                <Field label="Services">
                  <ServicePicker value={services} onChange={setServices} allowedCategories={["Marketing"]} />
                </Field>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Monthly invoice (gross, EUR)">
                  <Input
                    inputMode="numeric"
                    value={String(monthlyFee)}
                    onChange={(e) => setMonthlyFee(Number(e.target.value || 0))}
                  />
                </Field>
                <Field label="Net amount (optional)">
                  <Input inputMode="numeric" value={String(netAmount)} onChange={(e) => setNetAmount(Number(e.target.value || 0))} />
                </Field>
              </div>
            </Card>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button
                onClick={() => void submit()}
                disabled={!canSubmit}
                className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-900/90"
              >
                Create client
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

