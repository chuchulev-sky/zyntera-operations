"use client";

import * as React from "react";
import type { BusinessStatus, Project } from "@/lib/projects/types";
import { BUSINESS_STATUSES } from "@/lib/projects/types";
import { useProjectStore } from "@/lib/projects/store";
import { checklistCompletion, formatShortDate, isBlocked } from "@/lib/projects/helpers";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/projects/project-badges";
import { ProjectDetailsSheet } from "@/components/projects/project-details-sheet";
import { motion } from "framer-motion";

const BOARD_STATUSES: BusinessStatus[] = [
  "Lead",
  "Proposal Sent",
  "Won",
  "Scheduled",
  "In Progress",
  "Waiting for Client",
  "Blocked",
  "Completed",
];

export function CategoryFlowBoard({ projects }: { projects: Project[] }) {
  const { selectedProjectId, selectProject, updateProject, setProjectOrder } = useProjectStore();
  const selected = projects.find((p) => p.id === selectedProjectId) ?? null;
  const open = Boolean(selectedProjectId);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const byStatus = React.useMemo(() => {
    const map = new Map<BusinessStatus, Project[]>();
    for (const s of BUSINESS_STATUSES) map.set(s, []);
    for (const p of projects) map.get(p.status)?.push(p);
    for (const s of BOARD_STATUSES) {
      map.set(
        s,
        (map.get(s) ?? [])
          .slice()
          .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0) || a.startDate.localeCompare(b.startDate))
      );
    }
    return map;
  }, [projects]);

  const [activeId, setActiveId] = React.useState<string | null>(null);

  function findStatusOfProject(projectId: string): BusinessStatus | null {
    const p = projects.find((x) => x.id === projectId);
    return p?.status ?? null;
  }

  function statusFromOverId(overId: string): BusinessStatus | null {
    if (overId.startsWith("col:")) return overId.slice(4) as BusinessStatus;
    return findStatusOfProject(overId);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeProjectId = String(active.id);
    const overId = String(over.id);
    const from = findStatusOfProject(activeProjectId);
    const to = statusFromOverId(overId);
    if (!from || !to || from === to) return;
    updateProject(activeProjectId, { status: to });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeProjectId = String(active.id);
    const overId = String(over.id);
    const toStatus = statusFromOverId(overId);
    if (!toStatus) return;

    updateProject(activeProjectId, { status: toStatus });

    const dest = (byStatus.get(toStatus) ?? []).filter((p) => p.id !== activeProjectId);
    const overIsCard = !overId.startsWith("col:");
    const overIndex = overIsCard ? dest.findIndex((p) => p.id === overId) : -1;
    const insertAt = overIsCard && overIndex >= 0 ? overIndex : dest.length;

    const nextIds = dest.map((p) => p.id);
    nextIds.splice(insertAt, 0, activeProjectId);
    setProjectOrder(toStatus, nextIds);
  }

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActiveId(String(e.active.id))}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid gap-4 lg:grid-cols-4">
          {BOARD_STATUSES.map((status) => {
            const items = byStatus.get(status) ?? [];
            const colId = `col:${status}`;
            return (
              <Card key={status} className="zyntera-card overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-semibold">{status}</CardTitle>
                    <Badge variant="secondary">{items.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[560px]">
                    <div className="space-y-3 p-4 pt-0">
                      <SortableContext items={items.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                        {items.length === 0 ? (
                          <EmptyDropZone status={status} />
                        ) : (
                          items.map((p) => (
                            <SortableFlowCard
                              key={p.id}
                              project={p}
                              dragging={activeId === p.id}
                              onOpen={() => selectProject(p.id)}
                            />
                          ))
                        )}
                      </SortableContext>
                      <ColumnDropTarget id={colId} />
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DndContext>

      <ProjectDetailsSheet project={selected} open={open} onOpenChange={(next) => selectProject(next ? selectedProjectId : null)} />
    </div>
  );
}

function SortableFlowCard({
  project,
  dragging,
  onOpen,
}: {
  project: Project;
  dragging: boolean;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <button ref={setNodeRef} style={style} className="w-full text-left" onClick={onOpen} {...attributes} {...listeners}>
      <FlowCard project={project} dragging={dragging || isDragging} />
    </button>
  );
}

function FlowCard({ project, dragging }: { project: Project; dragging?: boolean }) {
  const c = checklistCompletion(project);
  const blocked = isBlocked(project);
  const order = { Web: 0, Design: 1, Marketing: 2 } as const;
  const services = (project.services ?? []).slice().sort((a, b) => order[a.category] - order[b.category] || a.name.localeCompare(b.name));

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className={[
        "rounded-2xl border bg-white/80 p-3 shadow-sm transition hover:border-zinc-300",
        project.status === "Waiting for Client" ? "opacity-80" : "",
        dragging ? "ring-2 ring-zinc-900/10" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{project.projectName}</div>
          <div className="truncate text-xs text-zinc-500">
            {project.companyName} • {project.clientName}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge variant="secondary" className="bg-white/70 border border-zinc-200 font-medium">
            {project.sourceOwner}
          </Badge>
          {blocked ? (
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900">
              Blocked
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge status={project.status} />
        <Badge variant="secondary">Start {formatShortDate(project.startDate)}</Badge>
        <Badge variant="outline">{c.percent}%</Badge>
      </div>

      {services.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {services.slice(0, 3).map((s) => (
            <Badge
              key={s.name}
              variant="outline"
              className={
                s.category === "Web"
                  ? "border-zinc-200 bg-white"
                  : s.category === "Design"
                    ? "border-indigo-200 bg-indigo-50 text-indigo-900 hover:bg-indigo-50"
                    : "border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-50"
              }
            >
              {s.name}
            </Badge>
          ))}
          {services.length > 3 ? <Badge variant="secondary">+{services.length - 3}</Badge> : null}
        </div>
      ) : null}

      <div className="mt-3">
        <Progress value={c.percent} />
      </div>
    </motion.div>
  );
}

function ColumnDropTarget({ id }: { id: string }) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef} className="h-2" />;
}

function EmptyDropZone({ status }: { status: BusinessStatus }) {
  return (
    <div className="rounded-2xl border border-dashed bg-white/70 p-3 text-sm text-zinc-500">
      Drop here to move into <span className="font-medium text-zinc-700">{status}</span>.
    </div>
  );
}

