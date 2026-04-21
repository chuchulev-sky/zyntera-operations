"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { MarketingChecklist, Project, WebsiteChecklist } from "@/lib/projects/types";

const WEBSITE_FIELDS: { key: keyof WebsiteChecklist; label: string }[] = [
  { key: "proposalPrepared", label: "Proposal prepared" },
  { key: "proposalSent", label: "Proposal sent" },
  { key: "proposalAccepted", label: "Proposal accepted" },
  { key: "contractSent", label: "Contract sent" },
  { key: "contractSigned", label: "Contract signed" },
  { key: "invoiceSent", label: "Invoice sent" },
  { key: "invoicePaid", label: "Invoice paid" },
  { key: "designStarted", label: "Design started" },
  { key: "designApproved", label: "Design approved" },
  { key: "developmentStarted", label: "Development started" },
  { key: "developmentCompleted", label: "Development completed" },
  { key: "revisionsRequested", label: "Revisions requested" },
  { key: "revisionsCompleted", label: "Revisions completed" },
  { key: "deployed", label: "Deployed" },
];

const MARKETING_FIELDS: { key: keyof MarketingChecklist; label: string }[] = [
  { key: "proposalPrepared", label: "Proposal prepared" },
  { key: "proposalSent", label: "Proposal sent" },
  { key: "proposalAccepted", label: "Proposal accepted" },
  { key: "contractSent", label: "Contract sent" },
  { key: "contractSigned", label: "Contract signed" },
  { key: "invoiceSent", label: "Invoice sent" },
  { key: "invoicePaid", label: "Invoice paid" },
  { key: "strategyDefined", label: "Strategy defined" },
  { key: "assetsCreated", label: "Assets created" },
  { key: "campaignSetup", label: "Campaign setup" },
  { key: "campaignLaunched", label: "Campaign launched" },
  { key: "optimizationOngoing", label: "Optimization ongoing" },
  { key: "reporting", label: "Reporting" },
];

export function ChecklistList({
  project,
  onToggle,
}: {
  project: Project;
  onToggle: (key: string) => void;
}) {
  const fields = project.category === "Website" ? WEBSITE_FIELDS : MARKETING_FIELDS;
  const checklist = project.checklist as Record<string, boolean>;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-3 rounded-lg border bg-white p-3">
          <Checkbox
            id={String(key)}
            checked={Boolean(checklist[String(key)])}
            onCheckedChange={() => onToggle(String(key))}
          />
          <Label htmlFor={String(key)} className="text-sm font-medium">
            {label}
          </Label>
        </div>
      ))}
    </div>
  );
}

