"use client";

import { Progress } from "@/components/ui/progress";
import { checklistCompletion } from "@/lib/projects/helpers";
import type { Project } from "@/lib/projects/types";

export function ProjectProgressBar({ project }: { project: Project }) {
  const c = checklistCompletion(project);
  return (
    <div className="min-w-[140px]">
      <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
        <span>Progress</span>
        <span>{c.percent}%</span>
      </div>
      <Progress value={c.percent} />
    </div>
  );
}

