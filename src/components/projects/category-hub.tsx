"use client";

import * as React from "react";
import type { ProjectCategory } from "@/lib/projects/types";
import { useProjectStore } from "@/lib/projects/store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectsTable } from "@/components/projects/projects-table";
import { CategoryFlowBoard } from "@/components/projects/category-flow-board";

export function CategoryHub({ category, title, subtitle }: { category: ProjectCategory; title: string; subtitle: string }) {
  const { projects } = useProjectStore();
  const items = React.useMemo(() => projects.filter((p) => p.category === category), [projects, category]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-zinc-500">{subtitle}</p>
      </div>

      <Tabs defaultValue="table" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="rounded-2xl bg-white/60 border border-zinc-200">
            <TabsTrigger value="table" className="rounded-xl">Table</TabsTrigger>
            <TabsTrigger value="board" className="rounded-xl">Kanban</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="table">
          <Card className="zyntera-card">
            <CardHeader>
              <CardTitle className="text-base">Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectsTable projects={items} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="board">
          <CategoryFlowBoard projects={items} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

