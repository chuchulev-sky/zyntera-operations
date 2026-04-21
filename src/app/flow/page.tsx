"use client";

import * as React from "react";
import { redirect } from "next/navigation";
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

export default function FlowBoardPage() {
  // Legacy flow-board (detailed status pipeline) is intentionally deprecated
  // in favor of Offers (pipeline) + Projects (commitments).
  redirect("/offers");
}
