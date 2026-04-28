"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { CommitmentProject } from "@/lib/commitments/types";
import type { SelectedService as PickerService } from "@/components/services/service-picker";
import type { EstimatorCategory, EstimatorComplexity, EstimatorUrgency } from "@/lib/estimator/types";
import type { EstimatorResult } from "@/lib/estimator/types";
import { buildEstimatorOfferNotes, buildEstimatorProjectNotes } from "@/app/estimator/_lib/helpers";

type Args = {
  clientName: string;
  companyName: string;
  projectName: string;
  category: EstimatorCategory;
  complexity: EstimatorComplexity;
  urgency: EstimatorUrgency;
  notes: string;
  services: PickerService[];
  result: EstimatorResult;
};

/**
 * Encapsulates estimator side effects for creating offers and projects.
 *
 * @param args Input state collected in the estimator form.
 * @param args.clientName Client person name.
 * @param args.companyName Company/account name.
 * @param args.projectName Human-readable project title.
 * @param args.category Project category used for both pricing and persistence.
 * @param args.complexity Selected complexity used for offer payload.
 * @param args.urgency Selected urgency used for note annotations.
 * @param args.notes Free-form estimator notes.
 * @param args.services Selected services from the service picker.
 * @param args.result Fully computed estimator result.
 * @returns Action callbacks and flags used by estimator buttons and state.
 */
export function useEstimatorActions(args: Args) {
  const router = useRouter();
  const { clientName, companyName, projectName, category, complexity, urgency, notes, services, result } = args;
  const canAct = Boolean(clientName.trim() && companyName.trim() && projectName.trim() && services.length > 0);
  const [submitting, setSubmitting] = React.useState(false);

  /**
   * Persists the current estimator as a draft offer and navigates to the Offers screen.
   *
   * @returns Promise that resolves when persistence flow completes.
   */
  const saveAsOffer = React.useCallback(async () => {
    if (!canAct || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientName: clientName.trim(),
          companyName: companyName.trim(),
          projectName: projectName.trim(),
          category,
          complexity: complexity === "Custom" ? "Custom" : complexity,
          selectedServices: services,
          notes: buildEstimatorOfferNotes({
            notes,
            urgency,
            minimumPrice: result.minimumPrice,
            recommendedPrice: result.recommendedPrice,
            rangeMin: result.suggestedRange.min,
            rangeMax: result.suggestedRange.max,
            riskLevel: result.riskLevel,
            capacityImpact: result.capacityImpact,
          }),
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
    } finally {
      setSubmitting(false);
    }
  }, [
    canAct,
    submitting,
    clientName,
    companyName,
    projectName,
    category,
    complexity,
    services,
    notes,
    urgency,
    result,
    router,
  ]);

  /**
   * Persists the current estimator as a commitment project and navigates to Projects.
   *
   * @returns Promise that resolves when persistence flow completes.
   */
  const createProject = React.useCallback(async () => {
    if (!canAct || submitting) return;
    setSubmitting(true);
    try {
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
          notes: buildEstimatorProjectNotes({
            notes,
            urgency,
            riskLevel: result.riskLevel,
            capacityImpact: result.capacityImpact,
            minimumPrice: result.minimumPrice,
            recommendedPrice: result.recommendedPrice,
            rangeMin: result.suggestedRange.min,
            rangeMax: result.suggestedRange.max,
          }),
        } satisfies Partial<CommitmentProject>),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Failed to create project");
      router.push("/projects");
    } finally {
      setSubmitting(false);
    }
  }, [
    canAct,
    submitting,
    clientName,
    companyName,
    projectName,
    category,
    services,
    result,
    notes,
    urgency,
    router,
  ]);

  return { canAct, submitting, saveAsOffer, createProject };
}
