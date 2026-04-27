import type { CommitmentProject } from "@/lib/commitments/types";

export const DEPARTMENTS = ["Development", "Design", "Marketing"] as const;
export type Department = (typeof DEPARTMENTS)[number];

// V1: fixed weekly capacity model (simple, explicit).
export const WEEKLY_CAPACITY_HOURS: Record<Department, number> = {
  Development: 80,
  Design: 40,
  Marketing: 60,
};

export type WeekKey = string; // YYYY-MM-DD (Monday)

export type WeekUsage = {
  weekStart: Date;
  weekKey: WeekKey;
  capacityByDept: Record<Department, number>;
  usedByDept: Record<Department, number>;
  freeByDept: Record<Department, number>;
  totalCapacity: number;
  totalUsed: number;
  totalFree: number;
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun..6=Sat
  const delta = day === 0 ? -6 : 1 - day; // move to Monday
  d.setDate(d.getDate() + delta);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

export function weekKey(date: Date): WeekKey {
  return isoDate(startOfWeekMonday(date));
}

export function formatWeekLabel(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  try {
    const fmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
    return `${fmt.format(weekStart)}–${fmt.format(end)}`;
  } catch {
    return `${isoDate(weekStart)}…`;
  }
}

export function departmentForCommitmentCategory(category: CommitmentProject["category"]): Department {
  return category === "Marketing" ? "Marketing" : category === "Design" ? "Design" : "Development";
}

function safeDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function projectWeeks(project: CommitmentProject): Date[] {
  const start = safeDate(project.startDate) ?? startOfWeekMonday(new Date());
  const end = safeDate(project.targetEndDate) ?? addDays(start, 13); // default ~2 weeks

  const startW = startOfWeekMonday(start);
  let endW = startOfWeekMonday(end);
  if (endW.getTime() < startW.getTime()) {
    endW = new Date(startW);
  }
  const out: Date[] = [];
  for (let w = new Date(startW); w.getTime() <= endW.getTime(); w = addWeeks(w, 1)) {
    out.push(new Date(w));
  }
  return out.length ? out : [new Date(startW)];
}

export function distributeCommittedHoursEvenlyByWeek(project: CommitmentProject): Map<WeekKey, number> {
  const hours = Math.max(0, Number(project.committedHours || 0));
  const weeks = projectWeeks(project);
  const perWeek = weeks.length > 0 ? hours / weeks.length : hours;
  const out = new Map<WeekKey, number>();
  for (const w of weeks) out.set(weekKey(w), perWeek);
  return out;
}

export function buildCapacityTimeline(args: {
  projects: CommitmentProject[];
  weeks: number;
  from?: Date;
}): WeekUsage[] {
  const from = startOfWeekMonday(args.from ?? new Date());
  const weeks = Math.max(1, Math.round(args.weeks || 0));

  const usedByWeekDept = new Map<WeekKey, Record<Department, number>>();

  for (const p of args.projects) {
    if (p.isArchived) continue;
    const dept = departmentForCommitmentCategory(p.category);
    const dist = distributeCommittedHoursEvenlyByWeek(p);
    for (const [wk, hrs] of dist.entries()) {
      const prev = usedByWeekDept.get(wk) ?? { Development: 0, Design: 0, Marketing: 0 };
      prev[dept] += hrs;
      usedByWeekDept.set(wk, prev);
    }
  }

  const timeline: WeekUsage[] = [];
  for (let i = 0; i < weeks; i++) {
    const weekStart = addWeeks(from, i);
    const wk = weekKey(weekStart);
    const used = usedByWeekDept.get(wk) ?? { Development: 0, Design: 0, Marketing: 0 };
    const usedRounded: Record<Department, number> = {
      Development: Math.round(used.Development || 0),
      Design: Math.round(used.Design || 0),
      Marketing: Math.round(used.Marketing || 0),
    };

    const free: Record<Department, number> = {
      Development: WEEKLY_CAPACITY_HOURS.Development - usedRounded.Development,
      Design: WEEKLY_CAPACITY_HOURS.Design - usedRounded.Design,
      Marketing: WEEKLY_CAPACITY_HOURS.Marketing - usedRounded.Marketing,
    };

    const totalCapacity = WEEKLY_CAPACITY_HOURS.Development + WEEKLY_CAPACITY_HOURS.Design + WEEKLY_CAPACITY_HOURS.Marketing;
    const totalUsed = usedRounded.Development + usedRounded.Design + usedRounded.Marketing;
    const totalFree = totalCapacity - totalUsed;

    timeline.push({
      weekStart,
      weekKey: wk,
      capacityByDept: { ...WEEKLY_CAPACITY_HOURS },
      usedByDept: usedRounded,
      freeByDept: free,
      totalCapacity,
      totalUsed,
      totalFree,
    });
  }

  return timeline;
}

export function scheduleWork(args: {
  projects: CommitmentProject[];
  department: Department;
  requiredHours: number;
  from?: Date;
  maxWeeks?: number;
}): { startWeek: Date; weeks: number; finishDate: Date } | null {
  const required = Math.max(0, Math.round(args.requiredHours || 0));
  if (required === 0) {
    const startWeek = startOfWeekMonday(args.from ?? new Date());
    return { startWeek, weeks: 0, finishDate: startWeek };
  }

  const maxWeeks = Math.max(6, Math.round(args.maxWeeks ?? 52));
  const from = startOfWeekMonday(args.from ?? new Date());
  const timeline = buildCapacityTimeline({ projects: args.projects, weeks: maxWeeks, from });

  // Find earliest start where we can fit required hours across subsequent weeks (greedy).
  for (let startIdx = 0; startIdx < timeline.length; startIdx++) {
    let remaining = required;
    let endIdx = startIdx;

    for (let i = startIdx; i < timeline.length; i++) {
      const week = timeline[i];
      const free = Math.max(0, Math.round(week.freeByDept[args.department] || 0));
      const take = Math.min(remaining, free);
      remaining -= take;
      endIdx = i;
      if (remaining <= 0) break;
    }

    if (remaining <= 0) {
      const startWeek = timeline[startIdx].weekStart;
      const finishWeekStart = timeline[endIdx].weekStart;
      const finishDate = addDays(finishWeekStart, 6); // Sunday
      return { startWeek, weeks: endIdx - startIdx + 1, finishDate };
    }
  }

  return null;
}

