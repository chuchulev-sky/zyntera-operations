"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/lib/projects/store";
import { formatMonthLabel, lastNMonths, monthKey, latestPaymentStatus, lastPaymentDate } from "@/lib/marketing/helpers";
import type { MonthKey, MonthlyPaymentStatus } from "@/lib/marketing/types";
import { NewMarketingClientModal } from "@/components/marketing/new-marketing-client-modal";

export function MarketingRetainers() {
  const { marketingClients } = useProjectStore();

  const active = marketingClients.filter((c) => c.status === "Active");
  const thisMonth = monthKey();

  const mrrGross = active.reduce((acc, c) => acc + (c.monthlyFee || 0), 0);
  const collectedThisMonth = active.reduce((acc, c) => {
    const r = c.records.find((x) => x.month === thisMonth);
    return acc + (r?.paymentStatus === "Paid" ? c.monthlyFee : 0);
  }, 0);
  const outstanding = active.reduce((acc, c) => {
    const r = c.records.find((x) => x.month === thisMonth);
    return acc + (r?.paymentStatus === "Paid" ? 0 : c.monthlyFee);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Marketing</h1>
          <p className="text-sm text-zinc-500">
            Recurring retainers. Monthly tracking, clean visibility, no project-flow noise.
          </p>
        </div>
        <NewMarketingClientModal
          trigger={
            <Button className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-900/90">New client</Button>
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ValueCard title="Monthly Recurring Revenue (MRR)" value={formatEUR(mrrGross)} />
        <ValueCard title="Collected this month" value={formatEUR(collectedThisMonth)} accent />
        <ValueCard title="Outstanding payments" value={formatEUR(outstanding)} />
      </div>

      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList className="rounded-2xl bg-white/60 border border-zinc-200">
          <TabsTrigger value="clients" className="rounded-xl">Clients</TabsTrigger>
          <TabsTrigger value="monthly" className="rounded-xl">Monthly tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
          <ClientsTable month={thisMonth} />
        </TabsContent>

        <TabsContent value="monthly">
          <MonthlyTracking />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ClientsTable({ month }: { month: MonthKey }) {
  const { marketingClients } = useProjectStore();
  const rows = marketingClients.filter((c) => c.status === "Active");

  return (
    <Card className="zyntera-card overflow-x-auto">
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Active clients</CardTitle>
          <div className="text-sm text-zinc-500">{formatMonthLabel(month)} snapshot</div>
        </div>
        <Badge variant="secondary">{rows.length}</Badge>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Services</TableHead>
              <TableHead>Monthly fee</TableHead>
              <TableHead>Creatives</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Payment status</TableHead>
              <TableHead>Last payment date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((c) => {
              const st = latestPaymentStatus(c, month);
              const last = lastPaymentDate(c);
              return (
                <TableRow key={c.id} className={st !== "Paid" ? "bg-amber-50/30" : undefined}>
                  <TableCell className="font-medium">{c.clientName}</TableCell>
                  <TableCell className="text-sm text-zinc-600">{c.services.join(", ")}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatEUR(c.monthlyFee)}</TableCell>
                  <TableCell>{c.creativesPerMonth || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={c.status === "Active" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-zinc-200 bg-zinc-50 text-zinc-600"}>
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-white/70 border border-zinc-200 font-medium">
                      {c.owner}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <PaymentBadge status={st} />
                  </TableCell>
                  <TableCell className="text-sm text-zinc-600">
                    {last ? new Date(last).toLocaleDateString() : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function MonthlyTracking() {
  const { marketingClients, upsertMarketingClientRecord } = useProjectStore();
  const months = React.useMemo(() => lastNMonths(6), []);
  const active = marketingClients.filter((c) => c.status === "Active");

  function setStatus(clientId: string, month: MonthKey, status: MonthlyPaymentStatus) {
    upsertMarketingClientRecord(clientId, month, status);
  }

  return (
    <Card className="zyntera-card overflow-x-auto">
      <CardHeader>
        <CardTitle className="text-base">Monthly tracking</CardTitle>
        <div className="text-sm text-zinc-500">Mark payments quickly. Unpaid clients are highlighted.</div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              {months.map((m) => (
                <TableHead key={m} className="whitespace-nowrap">{formatMonthLabel(m)}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {active.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.clientName}</TableCell>
                {months.map((m) => {
                  const st = latestPaymentStatus(c, m);
                  return (
                    <TableCell key={m} className={st !== "Paid" ? "bg-amber-50/30" : undefined}>
                      <div className="flex items-center gap-2">
                        <PaymentBadge status={st} />
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="secondary" className="h-7 rounded-xl" onClick={() => setStatus(c.id, m, "Paid")}>
                            Paid
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 rounded-xl" onClick={() => setStatus(c.id, m, "Unpaid")}>
                            Unpaid
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 rounded-xl" onClick={() => setStatus(c.id, m, "Late")}>
                            Late
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function PaymentBadge({ status }: { status: MonthlyPaymentStatus }) {
  const cls =
    status === "Paid"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : status === "Late"
        ? "border-rose-200 bg-rose-50 text-rose-900"
        : "border-amber-200 bg-amber-50 text-amber-900";
  return (
    <Badge variant="outline" className={cls}>
      {status}
    </Badge>
  );
}

function ValueCard({ title, value, accent }: { title: string; value: string; accent?: boolean }) {
  return (
    <Card className="zyntera-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-600">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <div className="text-xl font-semibold tracking-tight text-zinc-900">{value}</div>
        {accent ? (
          <Badge className="border-transparent bg-gradient-to-r from-indigo-500/90 to-fuchsia-500/90 text-white" variant="outline">
            This month
          </Badge>
        ) : (
          <Badge variant="secondary">Live</Badge>
        )}
      </CardContent>
    </Card>
  );
}

function formatEUR(value: number): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
  } catch {
    return `EUR ${Math.round(value).toLocaleString()}`;
  }
}

