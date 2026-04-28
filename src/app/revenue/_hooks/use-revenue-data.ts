"use client";

import * as React from "react";
import {
  calculateRevenueFromCommitments,
  calculateRevenueFromOffers,
  formatMoneySummary,
  revenueSplitByCategory,
} from "@/lib/revenue/derived";
import type { Offer } from "@/lib/offers/types";
import type { CommitmentProject } from "@/lib/commitments/types";

/**
 * Loads revenue source entities (offers and commitment projects) and returns
 * precomputed display-ready aggregates for the Revenue page.
 *
 * @returns Revenue metrics and category split maps ready for rendering.
 */
export function useRevenueData() {
  const [offers, setOffers] = React.useState<Offer[]>([]);
  const [projects, setProjects] = React.useState<CommitmentProject[]>([]);

  React.useEffect(() => {
    void Promise.all([
      fetch("/api/offers", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/projects", { cache: "no-store" }).then((r) => r.json()),
    ]).then(([o, p]) => {
      setOffers(((o as { offers?: Offer[] }).offers ?? []) as Offer[]);
      setProjects(((p as { projects?: CommitmentProject[] }).projects ?? []) as CommitmentProject[]);
    });
  }, []);

  const offerRev = calculateRevenueFromOffers(offers);
  const projRev = calculateRevenueFromCommitments(projects);

  return {
    estimated: formatMoneySummary(offerRev.estimated),
    confirmed: formatMoneySummary(projRev.confirmed),
    paid: formatMoneySummary(projRev.paid),
    outstanding: formatMoneySummary(projRev.outstanding),
    byCat: revenueSplitByCategory(projects),
  };
}
