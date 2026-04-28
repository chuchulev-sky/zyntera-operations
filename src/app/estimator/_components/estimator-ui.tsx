import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cls } from "@/app/estimator/_lib/helpers";

/**
 * Generic form field wrapper with consistent estimator label styling.
 *
 * @param props Component props.
 * @param props.label Label text displayed above the field.
 * @param props.children Form control content.
 * @returns Field container with label and control.
 */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-2">
      <Label className="text-xs font-medium text-zinc-500">{label}</Label>
      {children}
    </div>
  );
}

/**
 * Clickable boolean toggle row used in estimator option groups.
 *
 * @param props Component props.
 * @param props.label Human-readable toggle label.
 * @param props.checked Current boolean value.
 * @param props.onCheckedChange Callback invoked with the next boolean state.
 * @returns Toggle button row component.
 */
export function Toggle({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className="flex items-center justify-between gap-3 rounded-xl border bg-white px-3 py-2 text-sm"
    >
      <span className="text-zinc-800">{label}</span>
      <span
        className={cls(
          "rounded-full px-2 py-0.5 text-xs font-medium",
          checked ? "bg-emerald-100 text-emerald-900" : "bg-zinc-100 text-zinc-700"
        )}
      >
        {checked ? "Yes" : "No"}
      </span>
    </button>
  );
}

/**
 * Small metric card used in the estimator result summary.
 *
 * @param props Component props.
 * @param props.label Metric title.
 * @param props.value Metric value text.
 * @param props.accent When true, applies highlighted card styling.
 * @returns Rendered metric card.
 */
export function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cls("rounded-xl border bg-white p-4", accent && "border-zinc-200/70 bg-white/70")}>
      <div className="text-[11px] text-zinc-500">{label}</div>
      <div className="mt-1 text-base font-semibold tracking-tight text-zinc-900">{value}</div>
    </div>
  );
}

/**
 * Status pill card for risk and capacity indicators.
 *
 * @param props Component props.
 * @param props.label Pill title.
 * @param props.value Pill value text.
 * @param props.tone Visual severity tone (`good`, `mid`, `bad`).
 * @returns Rendered pill indicator card.
 */
export function Pill({ label, value, tone }: { label: string; value: string; tone: "good" | "mid" | "bad" }) {
  const c =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "mid"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-rose-200 bg-rose-50 text-rose-900";

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-[11px] text-zinc-500">{label}</div>
      <Badge variant="outline" className={cls("mt-2", c)}>
        {value}
      </Badge>
    </div>
  );
}

/**
 * Reusable explanation block for drivers, cost factors, and risks.
 *
 * @param props Component props.
 * @param props.title Section heading.
 * @param props.items Bullet list entries to render.
 * @param props.empty Fallback text when there are no entries.
 * @returns Explanation panel component.
 */
export function Explain({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-xs font-semibold text-zinc-900">{title}</div>
      <div className="mt-2 text-sm text-zinc-600">
        {items.length === 0 ? (
          <div className="text-sm text-zinc-500">{empty}</div>
        ) : (
          <ul className="list-disc pl-5">
            {items.slice(0, 6).map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
