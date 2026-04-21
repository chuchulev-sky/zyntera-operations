"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Offer, OfferCategory, OfferComplexity, OfferStatus } from "@/lib/offers/types";
import { OFFER_CATEGORIES, OFFER_COMPLEXITIES, OFFER_STATUSES } from "@/lib/offers/types";
import { NewOfferModal } from "@/components/offers/new-offer-modal";
import { EditOfferModal } from "@/components/offers/edit-offer-modal";

function formatEUR(value: number): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
  } catch {
    return `EUR ${Math.round(value).toLocaleString()}`;
  }
}

export default function OffersPage() {
  const [offers, setOffers] = React.useState<Offer[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [q, setQ] = React.useState("");
  const [category, setCategory] = React.useState<OfferCategory | "All">("All");
  const [complexity, setComplexity] = React.useState<OfferComplexity | "All">("All");
  const [status, setStatus] = React.useState<OfferStatus | "All">("All");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/offers", { cache: "no-store" });
      const json = (await res.json()) as { offers: Offer[] };
      setOffers((json.offers ?? []).filter((o) => !o.isArchived));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return offers
      .filter((o) => {
        if (category !== "All" && o.category !== category) return false;
        if (complexity !== "All" && o.complexity !== complexity) return false;
        if (status !== "All" && o.status !== status) return false;
        if (!needle) return true;
        const hay = `${o.clientName} ${o.companyName} ${o.projectName}`.toLowerCase();
        return hay.includes(needle);
      })
      .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
  }, [offers, q, category, complexity, status]);

  async function archive(offerId: string) {
    await fetch(`/api/offers/${offerId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ archive: true }),
    });
    await load();
  }

  async function convert(offerId: string) {
    const res = await fetch(`/api/offers/${offerId}/convert`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to convert offer");
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Offers</h1>
          <p className="text-sm text-zinc-500">
            Estimation pipeline. Build the scope, see workload, and convert only after approval.
          </p>
        </div>
        <NewOfferModal
          trigger={
            <Button className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-900/90">Add offer</Button>
          }
          onCreated={load}
        />
      </div>

      <Card className="zyntera-card">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Pipeline</CardTitle>
            <Badge variant="secondary">
              {loading ? "Loading…" : `${filtered.length} shown`}
            </Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search client, company, offer…" />

            <Select value={category} onValueChange={(v) => setCategory(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All categories</SelectItem>
                {OFFER_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={complexity} onValueChange={(v) => setComplexity(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Complexity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All complexities</SelectItem>
                {OFFER_COMPLEXITIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All statuses</SelectItem>
                {OFFER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client / Company</TableHead>
                  <TableHead>Offer</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Complexity</TableHead>
                  <TableHead>Est. hours</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>Suggested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-sm text-zinc-500">
                      Loading offers…
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-sm text-zinc-500">
                      No offers match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <div className="min-w-[220px]">
                          <div className="text-sm font-medium">{o.companyName}</div>
                          <div className="text-xs text-zinc-500">{o.clientName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-[260px]">
                          <div className="text-sm font-medium">{o.projectName}</div>
                          <div className="mt-1 text-xs text-zinc-500 line-clamp-1">
                            {(o.selectedServices ?? []).map((s) => s.name).join(", ") || "—"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{o.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{o.complexity}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{o.estimatedHours || 0}</TableCell>
                      <TableCell className="whitespace-nowrap">{o.estimatedTimelineDays ? `${o.estimatedTimelineDays}d` : "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatEUR(o.suggestedPrice || 0)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            o.status === "Accepted"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                              : o.status === "Sent"
                                ? "border-indigo-200 bg-indigo-50 text-indigo-900"
                                : "border-zinc-200 bg-white text-zinc-700"
                          }
                        >
                          {o.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <EditOfferModal
                            offer={o}
                            onSaved={load}
                            trigger={
                              <Button variant="outline" className="rounded-xl">
                                Edit
                              </Button>
                            }
                          />
                          <Button
                            variant="secondary"
                            className="rounded-xl"
                            onClick={() => void convert(o.id)}
                            disabled={o.status !== "Accepted"}
                            title={o.status !== "Accepted" ? "Set status to Accepted to convert" : undefined}
                          >
                            Convert
                          </Button>
                          <Button variant="outline" className="rounded-xl" onClick={() => void archive(o.id)}>
                            Archive
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

