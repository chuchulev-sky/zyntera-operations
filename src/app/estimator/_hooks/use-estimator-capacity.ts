"use client";

import * as React from "react";
import type { CommitmentProject } from "@/lib/commitments/types";
import {
  buildCapacityTimeline,
  formatWeekLabel,
  startOfWeekMonday,
  WEEKLY_CAPACITY_HOURS,
} from "@/lib/capacity/forecast";
import type { Dept } from "@/app/estimator/_lib/helpers";
import { deptForCategory, fetchActiveCommitmentProjects } from "@/app/estimator/_lib/helpers";
import type { EstimatorCategory } from "@/lib/estimator/types";

/**
 * Loads and derives capacity context for the estimator screen.
 *
 * This hook fetches active commitment projects once, then computes:
 * - current-week department usage
 * - free capacity for the selected category
 * - preformatted week label for UI rendering
 *
 * @param args Hook configuration.
 * @param args.category Estimator category currently selected by the user.
 * @returns Capacity state and derived values consumed by the estimator UI.
 */
export function useEstimatorCapacity(args: { category: EstimatorCategory }) {
  const { category } = args;
  const [capLoading, setCapLoading] = React.useState(false);
  const [projects, setProjects] = React.useState<CommitmentProject[]>([]);
  const [currentWeekUsed, setCurrentWeekUsed] = React.useState<Record<Dept, number>>({
    Development: 0,
    Marketing: 0,
    Design: 0,
  });

  React.useEffect(() => {
    setCapLoading(true);
    fetchActiveCommitmentProjects()
      .then((active) => {
        setProjects(active);
        const tl = buildCapacityTimeline({ projects: active, weeks: 1 });
        const used = (tl[0]?.usedByDept ?? {
          Development: 0,
          Marketing: 0,
          Design: 0,
        }) as Record<Dept, number>;
        setCurrentWeekUsed(used);
      })
      .finally(() => setCapLoading(false));
  }, []);

  const dept = deptForCategory(category);
  const weeklyCap = WEEKLY_CAPACITY_HOURS[dept];
  const currentUsed = Math.round(currentWeekUsed[dept] || 0);
  const currentFree = Math.max(0, weeklyCap - currentUsed);
  const freeCapacity = currentFree;
  const timelineLabel = React.useMemo(() => formatWeekLabel(startOfWeekMonday(new Date())), []);

  return {
    capLoading,
    projects,
    dept,
    weeklyCap,
    currentUsed,
    currentFree,
    freeCapacity,
    timelineLabel,
  };
}
