"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoneySummary } from "@/lib/revenue/derived";
import { useRevenueData } from "@/app/revenue/_hooks/use-revenue-data";

/**
 * Revenue analytics page for high-level commercial visibility.
 *
 * Renders pipeline estimates (offers), confirmed/paid/outstanding commitment totals,
 * and a per-category revenue split.
 *
 * @returns Revenue dashboard page component.
 */
export default function RevenuePage() {
  const { estimated, confirmed, paid, outstanding, byCat } = useRevenueData();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Revenue</h1>
          <p className="text-sm text-zinc-500">
            Estimated offer value counts Draft + Sent only (Accepted is reflected in commitments). Outstanding is
            invoiced minus paid (AR on billed work).
          </p>
        </div>
        <Badge variant="secondary">Early</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <ValueCard title="Estimated (Draft + Sent)" value={estimated} />
        <ValueCard title="Confirmed (projects)" value={confirmed} accent />
        <ValueCard title="Paid" value={paid} />
        <ValueCard title="Outstanding (invoiced − paid)" value={outstanding} />
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

/**
 * Reusable value card for top KPI metrics.
 *
 * @param props Component props.
 * @param props.title KPI title text.
 * @param props.value Formatted KPI value text.
 * @param props.accent Optional visual emphasis style.
 * @returns KPI card component.
 */
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

/**
 * Simple label/value row used inside stacked metric sections.
 *
 * @param props Component props.
 * @param props.label Row label.
 * @param props.value Row formatted value.
 * @returns Row component for compact summaries.
 */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="text-zinc-600">{label}</div>
      <div className="font-medium text-zinc-900">{value}</div>
    </div>
  );
}


