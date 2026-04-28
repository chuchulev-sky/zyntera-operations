"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { formatEUR } from "@/lib/format/currency";
import { scheduleWork, startOfWeekMonday, type Department as CapacityDept } from "@/lib/capacity/forecast";
import { CUSTOM_FEATURE_OPTIONS, MARKETING_CHANNEL_OPTIONS } from "@/app/estimator/_lib/constants";
import { cls, formatDate } from "@/app/estimator/_lib/helpers";
import { useEstimatorCapacity } from "@/app/estimator/_hooks/use-estimator-capacity";
import { useEstimatorActions } from "@/app/estimator/_hooks/use-estimator-actions";
import { Explain, Field, Metric, Pill, Toggle } from "@/app/estimator/_components/estimator-ui";

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

  const [channels, setChannels] = React.useState<MarketingChannel[]>(["Facebook Ads"]);
  const [creativesPerMonth, setCreativesPerMonth] = React.useState("8");
  const [reportingLevel, setReportingLevel] = React.useState<ReportingLevel>("Standard");
  const [landingPageSupport, setLandingPageSupport] = React.useState(true);
  const [campaignComplexity, setCampaignComplexity] = React.useState<CampaignComplexity>("Medium");

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
      clientName,
      projectName,
      category,
      services,
      complexity,
      urgency,
      notes,
      websiteType,
      pageCount,
      multilingual,
      cmsRequired,
      customFeatures,
      contentReady,
      seoSetupIncluded,
      uiuxIncluded,
      brandingIncluded,
      expectedRevisions,
      channels,
      creativesPerMonth,
      reportingLevel,
      landingPageSupport,
      campaignComplexity,
    ]
  );

  const {
    capLoading,
    projects,
    dept,
    weeklyCap,
    currentUsed,
    currentFree,
    freeCapacity,
    timelineLabel,
  } = useEstimatorCapacity({ category });
  const result = React.useMemo(() => estimateAll({ ...input, freeCapacityHours: freeCapacity }), [input, freeCapacity]);
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
  const weeksUntilStart = schedule
    ? Math.max(
        0,
        Math.round(
          (startOfWeekMonday(schedule.startWeek).getTime() - startOfWeekMonday(new Date()).getTime()) /
            (7 * 24 * 60 * 60 * 1000)
        )
      )
    : null;
  const actions = useEstimatorActions({
    clientName,
    companyName,
    projectName,
    category,
    complexity,
    urgency,
    notes,
    services,
    result,
  });

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
                      {CUSTOM_FEATURE_OPTIONS.map((feature) => (
                        <label key={feature} className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm">
                          <Checkbox checked={customFeatures.includes(feature)} onCheckedChange={() => toggleFeature(feature)} />
                          <span className="text-zinc-800">{feature}</span>
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
                      {MARKETING_CHANNEL_OPTIONS.map((channel) => (
                        <label key={channel} className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm">
                          <Checkbox checked={channels.includes(channel)} onCheckedChange={() => toggleChannel(channel)} />
                          <span className="text-zinc-800">{channel}</span>
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

            <Field label="Notes">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[110px]" placeholder="Constraints, assumptions, unknowns…" />
            </Field>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="secondary" className="rounded-xl" onClick={reset}>
                Reset Estimator
              </Button>
              <Button className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-900/90" disabled={!actions.canAct} onClick={() => router.push("#results")}>
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
                      Week: <span className="font-medium text-zinc-700">{timelineLabel}</span> • Dept: <span className="font-medium text-zinc-700">{dept}</span> • Used:{" "}
                      <span className="font-medium text-zinc-700">{capLoading ? "…" : `${currentUsed}h`}</span> • Free: <span className="font-semibold text-zinc-900">{capLoading ? "…" : `${currentFree}h`}</span> • Capacity:{" "}
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
                            Projected finish <span className="font-semibold">{formatDate(schedule.finishDate)}</span>
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
                    disabled={!actions.canAct || actions.submitting}
                    onClick={() => {
                      void actions.saveAsOffer();
                    }}
                  >
                    Save as Offer
                  </Button>
                  <Button
                    className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-900/90"
                    disabled={!actions.canAct || actions.submitting}
                    onClick={() => void actions.createProject()}
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
