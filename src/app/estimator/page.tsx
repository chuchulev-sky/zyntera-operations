"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServicePicker, type SelectedService as PickerService } from "@/components/services/service-picker";
import type {
  CampaignComplexity,
  EstimatorCategory,
  EstimatorComplexity,
  EstimatorUrgency,
  ExpectedRevisions,
  MarketingChannel,
  ReportingLevel,
  WebsiteType,
} from "@/lib/estimator/types";
import { estimateAll } from "@/lib/estimator/logic";
import type { CommitmentProject } from "@/lib/commitments/types";
import {
  buildCapacityTimeline,
  formatWeekLabel,
  scheduleWork,
  startOfWeekMonday,
  type Department as CapacityDept,
  WEEKLY_CAPACITY_HOURS,
} from "@/lib/capacity/forecast";

type Dept = "Development" | "Marketing" | "Design";

function deptForCategory(category: EstimatorCategory): Dept {
  return category === "Marketing" ? "Marketing" : category === "Design" ? "Design" : "Development";
}

function formatEUR(value: number): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
  } catch {
    return `EUR ${Math.round(value).toLocaleString()}`;
  }
}

function formatDate(d: Date): string {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function cls(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function EstimatorPage() {
  const router = useRouter();

  const [clientName, setClientName] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [projectName, setProjectName] = React.useState("");
  const [category, setCategory] = React.useState<EstimatorCategory>("Website");
  const [complexity, setComplexity] = React.useState<EstimatorComplexity>("Medium");
  const [urgency, setUrgency] = React.useState<EstimatorUrgency>("Normal");
  const [notes, setNotes] = React.useState("");
  const [services, setServices] = React.useState<PickerService[]>([{ name: "Website Development", category: "Web" }]);

  // Website inputs
  const [websiteType, setWebsiteType] = React.useState<WebsiteType>("Corporate Website");
  const [pageCount, setPageCount] = React.useState("6");
  const [multilingual, setMultilingual] = React.useState(false);
  const [cmsRequired, setCmsRequired] = React.useState(true);
  const [customFeatures, setCustomFeatures] = React.useState<string[]>([]);
  const [contentReady, setContentReady] = React.useState(false);
  const [seoSetupIncluded, setSeoSetupIncluded] = React.useState(true);
  const [uiuxIncluded, setUiuxIncluded] = React.useState(false);
  const [brandingIncluded, setBrandingIncluded] = React.useState(false);
  const [expectedRevisions, setExpectedRevisions] = React.useState<ExpectedRevisions>("Medium");

  // Marketing inputs
  const [channels, setChannels] = React.useState<MarketingChannel[]>(["Facebook Ads"]);
  const [creativesPerMonth, setCreativesPerMonth] = React.useState("8");
  const [reportingLevel, setReportingLevel] = React.useState<ReportingLevel>("Standard");
  const [landingPageSupport, setLandingPageSupport] = React.useState(true);
  const [campaignComplexity, setCampaignComplexity] = React.useState<CampaignComplexity>("Medium");

  const [freeCapacity, setFreeCapacity] = React.useState<number>(0);
  const [capLoading, setCapLoading] = React.useState(false);
  const [projects, setProjects] = React.useState<CommitmentProject[]>([]);
  const [currentWeekUsed, setCurrentWeekUsed] = React.useState<Record<Dept, number>>({ Development: 0, Marketing: 0, Design: 0 });

  React.useEffect(() => {
    setCapLoading(true);
    fetch("/api/projects", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        const projects = ((json as any).projects ?? []) as CommitmentProject[];
        const active = projects.filter((p) => !p.isArchived);
        setProjects(active);

        const tl = buildCapacityTimeline({ projects: active, weeks: 1 });
        const used = (tl[0]?.usedByDept ?? { Development: 0, Marketing: 0, Design: 0 }) as Record<Dept, number>;
        setCurrentWeekUsed(used);

        const dept = deptForCategory(category);
        const cap = WEEKLY_CAPACITY_HOURS[dept];
        const free = Math.max(0, cap - Math.round(used[dept] || 0));
        setFreeCapacity(free);
      })
      .finally(() => setCapLoading(false));
  }, [category]);

  const input = React.useMemo(
    () => ({
      clientName,
      projectName,
      category,
      selectedServices: services,
      complexity,
      urgency,
      notes,
      website:
        category === "Website" || category === "Design"
          ? {
              websiteType,
              pageCount: Number(pageCount || 0),
              multilingual,
              cmsRequired,
              customFeatures,
              contentReady,
              seoSetupIncluded,
              uiuxIncluded,
              brandingIncluded,
              expectedRevisions,
            }
          : undefined,
      marketing:
        category === "Marketing"
          ? {
              channels,
              creativesPerMonth: Number(creativesPerMonth || 0),
              reportingLevel,
              landingPageSupport,
              campaignComplexity,
            }
          : undefined,
    }),
    [
      campaignComplexity,
      category,
      channels,
      clientName,
      cmsRequired,
      complexity,
      contentReady,
      creativesPerMonth,
      customFeatures,
      expectedRevisions,
      landingPageSupport,
      multilingual,
      notes,
      pageCount,
      projectName,
      reportingLevel,
      seoSetupIncluded,
      services,
      uiuxIncluded,
      brandingIncluded,
      urgency,
      websiteType,
    ]
  );

  const result = React.useMemo(() => estimateAll({ ...input, freeCapacityHours: freeCapacity }), [input, freeCapacity]);

  const dept = deptForCategory(category);
  const weeklyCap = WEEKLY_CAPACITY_HOURS[dept];
  const currentUsed = Math.round(currentWeekUsed[dept] || 0);
  const currentFree = Math.max(0, weeklyCap - currentUsed);
  const timelineLabel = React.useMemo(() => formatWeekLabel(startOfWeekMonday(new Date())), []);

  const schedule = React.useMemo(() => {
    if (projects.length === 0) return null;
    return scheduleWork({
      projects,
      department: dept as CapacityDept,
      requiredHours: result.estimatedHours,
      from: new Date(),
      maxWeeks: 26,
    });
  }, [projects, dept, result.estimatedHours]);

  const weeksUntilStart = schedule ? Math.max(0, Math.round((startOfWeekMonday(schedule.startWeek).getTime() - startOfWeekMonday(new Date()).getTime()) / (7 * 24 * 60 * 60 * 1000))) : null;

  function toggleFeature(name: string) {
    setCustomFeatures((prev) => (prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]));
  }

  function toggleChannel(ch: MarketingChannel) {
    setChannels((prev) => (prev.includes(ch) ? prev.filter((x) => x !== ch) : [...prev, ch]));
  }

  function reset() {
    setClientName("");
    setCompanyName("");
    setProjectName("");
    setCategory("Website");
    setComplexity("Medium");
    setUrgency("Normal");
    setNotes("");
    setServices([{ name: "Website Development", category: "Web" }]);

    setWebsiteType("Corporate Website");
    setPageCount("6");
    setMultilingual(false);
    setCmsRequired(true);
    setCustomFeatures([]);
    setContentReady(false);
    setSeoSetupIncluded(true);
    setUiuxIncluded(false);
    setBrandingIncluded(false);
    setExpectedRevisions("Medium");

    setChannels(["Facebook Ads"]);
    setCreativesPerMonth("8");
    setReportingLevel("Standard");
    setLandingPageSupport(true);
    setCampaignComplexity("Medium");
  }

  const canAct = clientName.trim() && companyName.trim() && projectName.trim() && services.length > 0;

  async function saveAsOffer() {
    if (!canAct) return;
    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        clientName: clientName.trim(),
        companyName: companyName.trim(),
        projectName: projectName.trim(),
        category,
        complexity: complexity === "Custom" ? "Custom" : complexity, // Offer supports Custom
        selectedServices: services,
        notes: [
          notes.trim(),
          "",
          `Estimator: urgency=${urgency}`,
          `Estimator: min=${result.minimumPrice} EUR, recommended=${result.recommendedPrice} EUR, range=${result.suggestedRange.min}-${result.suggestedRange.max} EUR`,
          `Estimator: risk=${result.riskLevel}, capacityImpact=${result.capacityImpact}`,
        ]
          .filter(Boolean)
          .join("\n"),
        status: "Draft",
        suggestedPrice: result.recommendedPrice,
        estimatedHours: result.estimatedHours,
        estimatedTimelineDays: result.estimatedTimelineDays,
        workloadByDepartment:
          category === "Marketing"
            ? { Marketing: result.estimatedHours }
            : category === "Design"
              ? { WebDesign: result.estimatedHours }
              : { Development: result.estimatedHours },
        manual: true,
      }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Failed to create offer");
    router.push("/offers");
  }

  async function createProject() {
    if (!canAct) return;
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
        estimatedHours: result.estimatedHours,
        committedHours: result.estimatedHours,
        priceTotal: result.recommendedPrice,
        currency: "EUR",
        paymentStatus: "Unpaid",
        workloadStatus: result.capacityImpact === "High" ? "AtRisk" : "Healthy",
        notes: [
          notes.trim(),
          "",
          `Created from Estimator: urgency=${urgency}, risk=${result.riskLevel}, capacityImpact=${result.capacityImpact}`,
          `Pricing: min=${result.minimumPrice} EUR, recommended=${result.recommendedPrice} EUR, range=${result.suggestedRange.min}-${result.suggestedRange.max} EUR`,
        ]
          .filter(Boolean)
          .join("\n"),
      } satisfies Partial<CommitmentProject>),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Failed to create project");
    router.push("/projects");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Estimator</h1>
          <p className="text-sm text-zinc-500">
            Internal decision tool. Estimate hours, pricing, capacity impact, and risk before creating an offer or a project.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="zyntera-card">
          <CardHeader className="space-y-2">
            <CardTitle className="text-base">Input</CardTitle>
            <div className="text-sm text-zinc-500">Keep it practical: scope, constraints, and urgency.</div>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-6 p-5 sm:p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Client">
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client name" />
              </Field>
              <Field label="Company">
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company name" />
              </Field>
              <div className="md:col-span-2">
                <Field label="Project name">
                  <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="What are we estimating?" />
                </Field>
              </div>
            </div>

            <Card className="zyntera-card p-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Category">
                  <Select value={category} onValueChange={(v) => setCategory(v as EstimatorCategory)}>
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
                <Field label="Complexity">
                  <Select value={complexity} onValueChange={(v) => setComplexity(v as EstimatorComplexity)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Urgency">
                  <Select value={urgency} onValueChange={(v) => setUrgency(v as EstimatorUrgency)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Fast">Fast</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="mt-4">
                <Field label="Selected services">
                  <ServicePicker value={services} onChange={setServices} />
                </Field>
              </div>
            </Card>

            <Tabs value={category === "Marketing" ? "marketing" : "website"} onValueChange={() => {}}>
              <TabsList>
                <TabsTrigger value="website" data-disabled={category === "Marketing"} aria-disabled={category === "Marketing"}>
                  Website / Design
                </TabsTrigger>
                <TabsTrigger value="marketing" data-disabled={category !== "Marketing"} aria-disabled={category !== "Marketing"}>
                  Marketing
                </TabsTrigger>
              </TabsList>

              <TabsContent value="website">
                <div className={cls("space-y-4", category === "Marketing" && "opacity-40 pointer-events-none")}>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Field label="Website type">
                      <Select value={websiteType} onValueChange={(v) => setWebsiteType(v as WebsiteType)}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Landing Page">Landing Page</SelectItem>
                          <SelectItem value="Corporate Website">Corporate Website</SelectItem>
                          <SelectItem value="E-commerce">E-commerce</SelectItem>
                          <SelectItem value="Custom Web App">Custom Web App</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Page count">
                      <Input inputMode="numeric" value={pageCount} onChange={(e) => setPageCount(e.target.value)} />
                    </Field>
                    <Field label="Expected revisions">
                      <Select value={expectedRevisions} onValueChange={(v) => setExpectedRevisions(v as ExpectedRevisions)}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <Toggle label="Multilingual" checked={multilingual} onCheckedChange={setMultilingual} />
                    <Toggle label="CMS required" checked={cmsRequired} onCheckedChange={setCmsRequired} />
                    <Toggle label="Content ready" checked={contentReady} onCheckedChange={setContentReady} />
                    <Toggle label="SEO setup included" checked={seoSetupIncluded} onCheckedChange={setSeoSetupIncluded} />
                    <Toggle label="UI/UX included" checked={uiuxIncluded} onCheckedChange={setUiuxIncluded} />
                    <Toggle label="Branding included" checked={brandingIncluded} onCheckedChange={setBrandingIncluded} />
                  </div>

                  <div>
                    <div className="text-xs font-medium text-zinc-500">Custom features</div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {["Auth / login", "Payments", "Booking", "Integrations", "Admin dashboard", "Performance/SEO tuning"].map((f) => (
                        <label key={f} className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm">
                          <Checkbox checked={customFeatures.includes(f)} onCheckedChange={() => toggleFeature(f)} />
                          <span className="text-zinc-800">{f}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="marketing">
                <div className={cls("space-y-4", category !== "Marketing" && "opacity-40 pointer-events-none")}>
                  <div>
                    <div className="text-xs font-medium text-zinc-500">Channels</div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {(["Facebook Ads", "Google Ads", "SEO", "Social Media Management", "Email Marketing"] as const).map((c) => (
                        <label key={c} className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm">
                          <Checkbox checked={channels.includes(c)} onCheckedChange={() => toggleChannel(c)} />
                          <span className="text-zinc-800">{c}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <Field label="Creatives / month">
                      <Input inputMode="numeric" value={creativesPerMonth} onChange={(e) => setCreativesPerMonth(e.target.value)} />
                    </Field>
                    <Field label="Reporting level">
                      <Select value={reportingLevel} onValueChange={(v) => setReportingLevel(v as ReportingLevel)}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Basic">Basic</SelectItem>
                          <SelectItem value="Standard">Standard</SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Campaign complexity">
                      <Select value={campaignComplexity} onValueChange={(v) => setCampaignComplexity(v as CampaignComplexity)}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <Toggle label="Landing page support" checked={landingPageSupport} onCheckedChange={setLandingPageSupport} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div>
              <Field label="Notes">
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[110px]" placeholder="Constraints, assumptions, unknowns…" />
              </Field>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="secondary" className="rounded-xl" onClick={reset}>
                Reset Estimator
              </Button>
              <Button
                className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-900/90"
                disabled={!canAct}
                onClick={() => router.push("#results")}
              >
                View results
              </Button>
            </div>
          </CardContent>
        </Card>

        <div id="results" className="lg:sticky lg:top-20">
          <Card className="zyntera-card">
            <CardHeader className="space-y-2">
              <CardTitle className="text-base">Results</CardTitle>
              <div className="text-sm text-zinc-500">Use this to decide if it’s worth taking and how to price it.</div>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-5 p-5 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <Metric label="Estimated Hours" value={`${result.estimatedHours}h`} />
                <Metric label="Estimated Timeline" value={`${result.estimatedTimelineDays} days`} />
                <Metric label="Current Pricing (Real)" value={formatEUR(result.minimumPrice)} />
                <Metric label="Recommended Pricing (Target)" value={formatEUR(result.recommendedPrice)} accent />
                <Metric label="€/hour" value={`${Math.round(result.eurPerHour)} €/h`} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Pill label="Capacity Impact" value={result.capacityImpact} tone={result.capacityImpact === "High" ? "bad" : result.capacityImpact === "Medium" ? "mid" : "good"} />
                <Pill label="Risk Level" value={result.riskLevel} tone={result.riskLevel === "High" ? "bad" : result.riskLevel === "Moderate" ? "mid" : "good"} />
              </div>

              <div className="rounded-xl border bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold tracking-tight text-zinc-900">Capacity snapshot</div>
                    <div className="mt-1 text-xs text-zinc-500">
                      Week: <span className="font-medium text-zinc-700">{timelineLabel}</span> • Dept:{" "}
                      <span className="font-medium text-zinc-700">{dept}</span> • Used:{" "}
                      <span className="font-medium text-zinc-700">{capLoading ? "…" : `${currentUsed}h`}</span> • Free:{" "}
                      <span className="font-semibold text-zinc-900">{capLoading ? "…" : `${currentFree}h`}</span> • Capacity:{" "}
                      <span className="font-medium text-zinc-700">{weeklyCap}h</span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      capLoading
                        ? "border-zinc-200 bg-white text-zinc-700"
                        : result.estimatedHours > currentFree
                          ? "border-rose-200 bg-rose-50 text-rose-900"
                          : "border-emerald-200 bg-emerald-50 text-emerald-900"
                    }
                  >
                    {capLoading ? "…" : result.estimatedHours > currentFree ? "FULL" : "OK"}
                  </Badge>
                </div>

                {!capLoading && result.estimatedHours > currentFree ? (
                  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
                    <div className="text-xs font-semibold text-rose-900">Next Available Slot</div>
                    <div className="mt-1 text-sm text-rose-900">
                      {schedule && weeksUntilStart !== null ? (
                        <div className="space-y-1">
                          <div>
                            Starts{" "}
                            <span className="font-semibold">
                              {weeksUntilStart === 0 ? "this week" : weeksUntilStart === 1 ? "in 1 week" : `in ${weeksUntilStart} weeks`}
                            </span>
                          </div>
                          <div>
                            Estimated duration <span className="font-semibold">{schedule.weeks} weeks</span>
                          </div>
                          <div>
                            Projected finish{" "}
                            <span className="font-semibold">{formatDate(schedule.finishDate)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-rose-900">No availability found in the next 26 weeks.</div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-3 text-sm">
                <Explain title="What drives the estimate" items={result.drivers} empty="Mostly driven by the selected services and core scope." />
                <Explain title="What makes it more expensive" items={result.expensiveFactors} empty="No major cost drivers selected yet." />
                <Explain title="What increases risk" items={result.riskFactors} empty="Low risk based on current inputs." />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button variant="secondary" className="rounded-xl" onClick={reset}>
                  Reset Estimator
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    disabled={!canAct}
                    onClick={() => void saveAsOffer()}
                  >
                    Save as Offer
                  </Button>
                  <Button
                    className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-900/90"
                    disabled={!canAct}
                    onClick={() => void createProject()}
                  >
                    Create Project
                  </Button>
                </div>
              </div>

              <div className="text-xs text-zinc-500">
                Current pricing uses internal base rate ({result.internalBaseRate}€/h). Recommended uses target rate ({result.targetRate}€/h) × 1.1.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
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

function Toggle({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className="flex items-center justify-between gap-3 rounded-xl border bg-white px-3 py-2 text-sm"
    >
      <span className="text-zinc-800">{label}</span>
      <span className={cls("rounded-full px-2 py-0.5 text-xs font-medium", checked ? "bg-emerald-100 text-emerald-900" : "bg-zinc-100 text-zinc-700")}>
        {checked ? "Yes" : "No"}
      </span>
    </button>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cls("rounded-xl border bg-white p-4", accent && "border-zinc-200/70 bg-white/70")}>
      <div className="text-[11px] text-zinc-500">{label}</div>
      <div className="mt-1 text-base font-semibold tracking-tight text-zinc-900">{value}</div>
    </div>
  );
}

function Pill({ label, value, tone }: { label: string; value: string; tone: "good" | "mid" | "bad" }) {
  const c =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "mid"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-rose-200 bg-rose-50 text-rose-900";

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-[11px] text-zinc-500">{label}</div>
      <Badge variant="outline" className={cls("mt-2", c)}>
        {value}
      </Badge>
    </div>
  );
}

function Explain({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-xs font-semibold text-zinc-900">{title}</div>
      <div className="mt-2 text-sm text-zinc-600">
        {items.length === 0 ? (
          <div className="text-sm text-zinc-500">{empty}</div>
        ) : (
          <ul className="list-disc pl-5">
            {items.slice(0, 6).map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

