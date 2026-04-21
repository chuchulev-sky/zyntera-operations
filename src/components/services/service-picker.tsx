"use client";

import * as React from "react";
import { groupServices, SERVICE_CATALOG, type ServiceCategory } from "@/lib/services/catalog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

export type SelectedService = { name: string; category: ServiceCategory };

export function ServicePicker({
  value,
  onChange,
  allowedCategories,
}: {
  value: SelectedService[];
  onChange: (next: SelectedService[]) => void;
  allowedCategories?: ServiceCategory[];
}) {
  const grouped = React.useMemo(() => groupServices(SERVICE_CATALOG), []);
  const selected = React.useMemo(() => new Map(value.map((s) => [s.name, s.category])), [value]);
  const cats = allowedCategories ?? (["Web", "Design", "Marketing"] as ServiceCategory[]);

  function toggle(name: string, category: ServiceCategory) {
    const next = new Map(selected);
    if (next.has(name)) next.delete(name);
    else next.set(name, category);
    onChange(Array.from(next.entries()).map(([n, c]) => ({ name: n, category: c })));
  }

  return (
    <div className="rounded-2xl border bg-white/70 p-3">
      <div className="flex flex-wrap gap-2">
        {value.length === 0 ? (
          <Badge variant="secondary">No services selected</Badge>
        ) : (
          value.map((s) => (
            <Badge key={s.name} variant="outline">
              {s.name}
            </Badge>
          ))
        )}
      </div>
      <div className="mt-3">
        <ScrollArea className="h-[220px] pr-3">
          <div className="space-y-4">
            {cats.map((cat) => (
              <div key={cat}>
                <div className="mb-2 text-xs font-medium text-zinc-500">{cat}</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {grouped[cat].map((opt) => {
                    const checked = selected.has(opt.name);
                    return (
                      <label
                        key={opt.name}
                        className="flex items-center gap-3 rounded-xl border bg-white p-2.5 hover:bg-zinc-50"
                      >
                        <Checkbox checked={checked} onCheckedChange={() => toggle(opt.name, opt.category)} />
                        <Label className="text-sm font-medium">{opt.name}</Label>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

