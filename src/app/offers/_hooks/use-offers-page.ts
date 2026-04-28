"use client";

import * as React from "react";
import type { Offer, OfferCategory, OfferComplexity, OfferStatus } from "@/lib/offers/types";

/**
 * View-model hook for the Offers page.
 *
 * It owns data loading, client-side filtering/sorting, and offer row actions.
 *
 * @returns Offers page state, filter setters, and action callbacks.
 */
export function useOffersPage() {
  const [offers, setOffers] = React.useState<Offer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const [category, setCategory] = React.useState<OfferCategory | "All">("All");
  const [complexity, setComplexity] = React.useState<OfferComplexity | "All">("All");
  const [status, setStatus] = React.useState<OfferStatus | "All">("All");

  /**
   * Fetches offers from API and stores active rows (non-archived only).
   *
   * @returns Promise that resolves after local state is updated.
   */
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

  /**
   * Soft archives an offer then refreshes the visible list.
   *
   * @param offerId Offer identifier to archive.
   * @returns Promise that resolves once refresh completes.
   */
  const archive = React.useCallback(
    async (offerId: string) => {
      await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ archive: true }),
      });
      await load();
    },
    [load]
  );

  /**
   * Converts an accepted offer into a commitment project then refreshes the list.
   *
   * @param offerId Offer identifier to convert.
   * @returns Promise that resolves once refresh completes.
   * @throws Error when the conversion request fails.
   */
  const convert = React.useCallback(
    async (offerId: string) => {
      const res = await fetch(`/api/offers/${offerId}/convert`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to convert offer");
      await load();
    },
    [load]
  );

  return {
    loading,
    q,
    setQ,
    category,
    setCategory,
    complexity,
    setComplexity,
    status,
    setStatus,
    filtered,
    load,
    archive,
    convert,
  };
}
