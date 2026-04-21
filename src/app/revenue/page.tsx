"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calculateRevenueFromCommitments,
  calculateRevenueFromOffers,
  formatMoneySummary,
  revenueSplitByCategory,
} from "@/lib/revenue/derived";
import type { Offer } from "@/lib/offers/types";
import type { CommitmentProject } from "@/lib/commitments/types";

export default function RevenuePage() {
  const [offers, setOffers] = React.useState<Offer[]>([]);
  const [projects, setProjects] = React.useState<CommitmentProject[]>([]);

  React.useEffect(() => {
    void Promise.all([
      fetch("/api/offers", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/projects", { cache: "no-store" }).then((r) => r.json()),
    ]).then(([o, p]) => {
      setOffers(((o as any).offers ?? []) as Offer[]);
      setProjects(((p as any).projects ?? []) as CommitmentProject[]);
    });
  }, []);

  const offerRev = calculateRevenueFromOffers(offers);
  const projRev = calculateRevenueFromCommitments(projects);

  const estimated = formatMoneySummary(offerRev.estimated);
  const confirmed = formatMoneySummary(projRev.confirmed);
  const paid = formatMoneySummary(projRev.paid);
  const outstanding = formatMoneySummary(projRev.outstanding);

  const byCat = revenueSplitByCategory(projects);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Revenue</h1>
          <p className="text-sm text-zinc-500">
            Derived visibility across offers (estimated) and commitments (confirmed/paid/outstanding).
          </p>
        </div>
        <Badge variant="secondary">Early</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <ValueCard title="Estimated (offers)" value={estimated} />
        <ValueCard title="Confirmed (projects)" value={confirmed} accent />
        <ValueCard title="Paid" value={paid} />
        <ValueCard title="Outstanding Revenue" value={outstanding} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="zyntera-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Revenue by category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from(byCat.entries()).length === 0 ? (
              <div className="text-sm text-zinc-500">No commitments yet.</div>
            ) : (
              Array.from(byCat.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([cat, map]) => <Row key={cat} label={cat} value={formatMoneySummary(map)} />)
            )}
            <div className="text-xs text-zinc-500">
              Confirmed revenue from commitment projects.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
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
    <Card className="zyntera-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-600">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <div className="text-xl font-semibold tracking-tight text-zinc-900">{value}</div>
        {accent ? (
          <Badge
            className="border-transparent bg-gradient-to-r from-indigo-500/90 to-fuchsia-500/90 text-white shadow-sm hover:from-indigo-500/90 hover:to-fuchsia-500/90"
            variant="outline"
          >
            Commercial
          </Badge>
        ) : (
          <Badge variant="secondary">Live</Badge>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="text-zinc-600">{label}</div>
      <div className="font-medium text-zinc-900">{value}</div>
    </div>
  );
}

function formatEUR(value: number): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
  } catch {
    return `EUR ${Math.round(value).toLocaleString()}`;
  }
}

