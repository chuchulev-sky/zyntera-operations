"use client";

import * as React from "react";
import type { Project, ProjectChecklist, ProjectFilters } from "@/lib/projects/types";
import { BUSINESS_STATUSES } from "@/lib/projects/types";
import type { MarketingClient, MonthKey, MonthlyPaymentStatus } from "@/lib/marketing/types";
import { monthKey } from "@/lib/marketing/helpers";

/**
 * Internal project store state backing the provider context.
 */
type ProjectStoreState = {
  projects: Project[];
  marketingClients: MarketingClient[];
  selectedProjectId: string | null;
  filters: ProjectFilters;
};

/**
 * Public actions exposed by project store context.
 */
type ProjectStoreActions = {
  setFilters: (next: ProjectFilters) => void;
  selectProject: (projectId: string | null) => void;
  createProject: (
    input: Omit<
      Project,
      "id" | "createdAt" | "updatedAt" | "checklist" | "activity" | "blockedReason"
    > & {
      checklist?: Partial<ProjectChecklist>;
    }
  ) => void;
  updateProject: (projectId: string, patch: Partial<Project>) => void;
  setProjectOrder: (status: Project["status"], orderedIds: string[]) => void;
  toggleChecklist: (projectId: string, key: string) => void;
  addNote: (projectId: string, author: string, body: string) => void;
  deleteProject: (projectId: string) => void;
  createMarketingClient: (input: {
    clientName: string;
    services: string[];
    monthlyFee: number;
    netAmount: number;
    creativesPerMonth: number;
    owner: MarketingClient["owner"];
    status: MarketingClient["status"];
  }) => void;
  upsertMarketingClientRecord: (clientId: string, month: MonthKey, status: MonthlyPaymentStatus) => void;
  refetchAll: () => Promise<void>;
};

/** Combined project store API type. */
type ProjectStore = ProjectStoreState & ProjectStoreActions;

/**
 * Normalizes legacy marketing clients to current owner enum values.
 *
 * @param clients Raw clients from API/store.
 * @returns Migrated marketing client list.
 */
function migrateMarketingClients(clients: MarketingClient[]): MarketingClient[] {
  return clients.map((c) => {
    const anyC = c as unknown as Record<string, unknown>;
    const owner =
      anyC.owner === "Peter" || anyC.owner === "Krasi" || anyC.owner === "Team"
        ? (anyC.owner as "Peter" | "Krasi" | "Team")
        : "Team";
    return { ...c, owner };
  });
}

/**
 * Migrates legacy project shapes to current domain model assumptions.
 *
 * Handles historical category/type/owner/payment fields with safe defaults.
 *
 * @param projects Raw project list.
 * @returns Migrated project list compatible with current UI.
 */
function migrateProjects(projects: Project[]): Project[] {
  return projects.map((p) => {
    const anyP = p as unknown as Record<string, unknown>;
    const checklist = (anyP.checklist ?? {}) as Record<string, boolean>;

    const hasMarketingKeys =
      "strategyDefined" in checklist ||
      "campaignLaunched" in checklist ||
      "optimizationOngoing" in checklist ||
      "reporting" in checklist;

    const legacyType = String(anyP.projectType ?? "");
    const inferredCategory =
      (anyP.category === "Website" || anyP.category === "Marketing"
        ? (anyP.category as "Website" | "Marketing")
        : hasMarketingKeys
          ? "Marketing"
          : legacyType.includes("Ads") || legacyType === "SEO" || legacyType.includes("Social") || legacyType.includes("Email")
            ? "Marketing"
            : "Website") as "Website" | "Marketing";

    const mappedType =
      legacyType === "Marketing Site" || legacyType === "Redesign" || legacyType === "Maintenance"
        ? "Corporate Website"
        : legacyType === "Web App"
          ? "Custom Web App"
          : legacyType === "Other" || legacyType === ""
            ? inferredCategory === "Marketing"
              ? "SEO"
              : "Corporate Website"
            : legacyType;

    const sourceOwner =
      anyP.sourceOwner === "Peter" || anyP.sourceOwner === "Krasi" || anyP.sourceOwner === "Team"
        ? (anyP.sourceOwner as "Peter" | "Krasi" | "Team")
        : anyP.owner === "Peter" || anyP.owner === "Krasi" || anyP.owner === "Team"
          ? (anyP.owner as "Peter" | "Krasi" | "Team")
          : "Team";

    const proposalAmount = typeof anyP.proposalAmount === "number" ? anyP.proposalAmount : 0;
    const agreedAmount = typeof anyP.agreedAmount === "number" ? anyP.agreedAmount : 0;
    const invoicedAmount = typeof anyP.invoicedAmount === "number" ? anyP.invoicedAmount : 0;
    const paidAmount = typeof anyP.paidAmount === "number" ? anyP.paidAmount : 0;
    const currency = typeof anyP.currency === "string" && anyP.currency.trim() ? anyP.currency : "EUR";
    const paymentStatus =
      anyP.paymentStatus === "Paid" || anyP.paymentStatus === "Partial" || anyP.paymentStatus === "Unpaid"
        ? (anyP.paymentStatus as "Paid" | "Partial" | "Unpaid")
        : invoicedAmount > 0 && paidAmount >= invoicedAmount
          ? "Paid"
          : paidAmount > 0
            ? "Partial"
            : "Unpaid";

    return {
      ...p,
      category: inferredCategory,
      sourceOwner,
      projectType: mappedType as Project["projectType"],
      checklist: checklist as ProjectChecklist,
      proposalAmount,
      agreedAmount,
      invoicedAmount,
      paidAmount,
      currency,
      paymentStatus,
    };
  });
}

/**
 * Ensures projects in each status lane have stable `sortIndex` values.
 *
 * Missing indexes are generated from ascending `startDate`.
 *
 * @param projects Project list to normalize.
 * @returns New project list with guaranteed sort indexes per status.
 */
function ensureSortIndexes(projects: Project[]): Project[] {
  const next = projects.map((p) => ({ ...p }));
  for (const status of BUSINESS_STATUSES) {
    const group = next.filter((p) => p.status === status);
    const needs = group.some((p) => typeof p.sortIndex !== "number");
    if (!needs) continue;
    group
      .slice()
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .forEach((p, idx) => {
        p.sortIndex = idx;
      });
  }
  return next;
}

const ProjectStoreContext = React.createContext<ProjectStore | null>(null);

/**
 * Provides project + marketing client state and actions to the application.
 *
 * @param props Provider props.
 * @param props.children React subtree that consumes store context.
 * @returns Context provider component.
 */
export function ProjectStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ProjectStoreState>(() => {
    return {
      projects: [],
      marketingClients: [],
      selectedProjectId: null,
      filters: { q: "", status: "All" },
    };
  });

  /**
   * Refetches projects and marketing clients from API and refreshes local store state.
   *
   * @returns Promise resolved once state is updated.
   */
  const refetchAll = React.useCallback(async () => {
    const [webRes, mktRes] = await Promise.all([
      fetch("/api/websites/projects", { cache: "no-store" }),
      fetch("/api/marketing/clients", { cache: "no-store" }),
    ]);

    if (!webRes.ok) throw new Error("Failed to load website projects");
    if (!mktRes.ok) throw new Error("Failed to load marketing clients");

    const webJson = (await webRes.json()) as { projects: Project[] };
    const mktJson = (await mktRes.json()) as { clients: MarketingClient[] };

    setState((s) => ({
      ...s,
      projects: ensureSortIndexes(migrateProjects(webJson.projects ?? [])),
      marketingClients: migrateMarketingClients(mktJson.clients ?? []),
    }));
  }, []);

  React.useEffect(() => {
    // Initial load from DB via API routes.
    void refetchAll().catch(() => {
      // If DB/env is missing, keep empty state (no seed fallback).
    });
  }, [refetchAll]);

  const api = React.useMemo<ProjectStore>(() => {
    return {
      ...state,
      setFilters: (next) => setState((s) => ({ ...s, filters: next })),
      selectProject: (projectId) => setState((s) => ({ ...s, selectedProjectId: projectId })),
      createProject: async (input) => {
        const res = await fetch("/api/websites/projects", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error("Failed to create project");
        await refetchAll();
      },
      updateProject: async (projectId, patch) => {
        const res = await fetch(`/api/websites/projects/${projectId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error("Failed to update project");
        await refetchAll();
      },
      setProjectOrder: (status, orderedIds) => {
        void fetch("/api/websites/projects/order", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status, orderedIds }),
        }).then(() => refetchAll()).catch(() => {});
      },
      toggleChecklist: (projectId, key) => {
        const p = state.projects.find((x) => x.id === projectId);
        if (!p) return;
        const nextChecklist = {
          ...(p.checklist as Record<string, boolean>),
          [key]: !(p.checklist as Record<string, boolean>)[key],
        } as ProjectChecklist;
        void fetch(`/api/websites/projects/${projectId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ checklist: nextChecklist }),
        }).then(() => refetchAll()).catch(() => {});
      },
      addNote: (projectId, author, body) => {
        void fetch(`/api/websites/projects/${projectId}/notes`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ author, body }),
        }).then(() => refetchAll()).catch(() => {});
      },
      deleteProject: (projectId) => {
        void fetch(`/api/websites/projects/${projectId}`, { method: "DELETE" })
          .then(() => refetchAll())
          .catch(() => {});
      },
      createMarketingClient: async (input) => {
        const res = await fetch("/api/marketing/clients", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error("Failed to create marketing client");
        await refetchAll();
      },
      upsertMarketingClientRecord: (clientId, month, status) => {
        const key = month || monthKey();
        void fetch("/api/marketing/clients/records", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ clientId, monthKey: key, paymentStatus: status }),
        }).then(() => refetchAll()).catch(() => {});
      },
      refetchAll,
    };
  }, [state, refetchAll]);

  return <ProjectStoreContext.Provider value={api}>{children}</ProjectStoreContext.Provider>;
}

/**
 * Consumes project store context.
 *
 * @returns Project store API.
 * @throws Error when called outside `ProjectStoreProvider`.
 */
export function useProjectStore() {
  const ctx = React.useContext(ProjectStoreContext);
  if (!ctx) throw new Error("useProjectStore must be used within ProjectStoreProvider");
  return ctx;
}

