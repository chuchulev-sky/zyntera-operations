"use client";

import type { BusinessStatus, Priority } from "@/lib/projects/types";
import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: BusinessStatus }) {
  const cls =
    status === "Scheduled"
      ? "border-transparent bg-gradient-to-r from-indigo-500/90 to-fuchsia-500/90 text-white shadow-sm hover:from-indigo-500/90 hover:to-fuchsia-500/90"
      : status === "In Progress"
        ? "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-50"
        : status === "Waiting for Client"
          ? "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-50"
          : status === "Blocked"
            ? "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-50"
            : status === "Completed"
              ? "border-zinc-200 bg-white text-zinc-900 hover:bg-white"
              : status === "Won"
                ? "border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-50"
                : status === "Proposal Sent"
                  ? "border-zinc-200 bg-white text-zinc-700 hover:bg-white"
                  : status === "Cancelled"
                    ? "border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-50"
                    : "border-zinc-200 bg-white text-zinc-900 hover:bg-white";
  return (
    <Badge variant="outline" className={cls}>
      {status}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const cls =
    priority === "Urgent"
      ? "border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-50"
      : priority === "High"
        ? "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-50"
        : priority === "Medium"
          ? "border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-50"
          : "border-zinc-200 bg-white text-zinc-600 hover:bg-white";
  return (
    <Badge variant="outline" className={cls}>
      {priority}
    </Badge>
  );
}

