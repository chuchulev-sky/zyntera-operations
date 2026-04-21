"use client";

import * as React from "react";
import type { Company, CompanyContact } from "@/lib/companies/types";
import { normalizeCompanyName } from "@/lib/companies/normalize";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

function splitTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function joinTags(tags: string[]): string {
  return (tags ?? []).join(", ");
}

function emptyContact(): CompanyContact {
  return { name: "", role: "", email: "", phone: "" };
}

export function CompanyDetailsSheet({
  company,
  open,
  onOpenChange,
  onSaved,
  onDeleted,
}: {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (nextName: string) => void;
  onDeleted: () => void;
}) {
  const [draft, setDraft] = React.useState<Company | null>(company);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setDraft(company);
    setError(null);
  }, [company?.id]);

  async function save() {
    if (!company || !draft) return;
    setSaving(true);
    setError(null);
    try {
      const target = encodeURIComponent(company.name);
      const body: Partial<Company> = {
        name: normalizeCompanyName(draft.name),
        notes: draft.notes ?? "",
        tags: draft.tags ?? [],
        website: draft.website ?? "",
        linkedin: draft.linkedin ?? "",
        billingEmail: draft.billingEmail ?? "",
        billingAddress: draft.billingAddress ?? "",
        vatNumber: draft.vatNumber ?? "",
        contacts: (draft.contacts ?? []).filter((c) => (c.name ?? "").trim()),
      };
      const res = await fetch(`/api/companies/${target}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to save company");
      const json = (await res.json()) as { company: Company };
      onSaved(json.company.name);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    if (!company) return;
    const ok = window.confirm(`Delete company profile “${company.name}”? This does not delete projects.`);
    if (!ok) return;
    setDeleting(true);
    setError(null);
    try {
      const target = encodeURIComponent(company.name);
      const res = await fetch(`/api/companies/${target}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error((await res.json()).error ?? "Failed to delete company");
      onDeleted();
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setDeleting(false);
    }
  }

  const d = draft;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[520px] space-y-6 sm:max-w-[520px]">
        <SheetHeader>
          <SheetTitle className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-base font-semibold">{company?.name ?? "Company"}</div>
              <div className="truncate text-sm font-normal text-zinc-500">Company profile</div>
            </div>
            <Badge variant="secondary" className="shrink-0">
              {company ? "Active" : "—"}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        {!company || !d ? (
          <div className="text-sm text-zinc-600">No company selected.</div>
        ) : (
          <div className="space-y-6">
            {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input value={d.name} onChange={(e) => setDraft({ ...d, name: e.target.value })} />
              </div>

              <div className="grid gap-2">
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={joinTags(d.tags)}
                  onChange={(e) => setDraft({ ...d, tags: splitTags(e.target.value) })}
                  placeholder="e.g. priority, saas, retail"
                />
              </div>

              <div className="grid gap-2">
                <Label>Notes</Label>
                <Textarea value={d.notes} onChange={(e) => setDraft({ ...d, notes: e.target.value })} />
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Website</Label>
                <Input value={d.website} onChange={(e) => setDraft({ ...d, website: e.target.value })} placeholder="https://…" />
              </div>
              <div className="grid gap-2">
                <Label>LinkedIn</Label>
                <Input value={d.linkedin} onChange={(e) => setDraft({ ...d, linkedin: e.target.value })} placeholder="https://…" />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="text-sm font-medium">Billing</div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Billing email</Label>
                  <Input value={d.billingEmail} onChange={(e) => setDraft({ ...d, billingEmail: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>VAT number</Label>
                  <Input value={d.vatNumber} onChange={(e) => setDraft({ ...d, vatNumber: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Billing address</Label>
                <Textarea value={d.billingAddress} onChange={(e) => setDraft({ ...d, billingAddress: e.target.value })} />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">Contacts</div>
                <Button
                  variant="secondary"
                  className="rounded-xl"
                  onClick={() => setDraft({ ...d, contacts: [...(d.contacts ?? []), emptyContact()] })}
                >
                  Add contact
                </Button>
              </div>

              <div className="space-y-3">
                {(d.contacts ?? []).length === 0 ? (
                  <div className="text-sm text-zinc-500">No contacts yet.</div>
                ) : (
                  (d.contacts ?? []).map((c, idx) => (
                    <div key={idx} className="rounded-xl border bg-white p-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="grid gap-1.5">
                          <Label>Name</Label>
                          <Input
                            value={c.name ?? ""}
                            onChange={(e) => {
                              const next = [...(d.contacts ?? [])];
                              next[idx] = { ...c, name: e.target.value };
                              setDraft({ ...d, contacts: next });
                            }}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label>Role</Label>
                          <Input
                            value={c.role ?? ""}
                            onChange={(e) => {
                              const next = [...(d.contacts ?? [])];
                              next[idx] = { ...c, role: e.target.value };
                              setDraft({ ...d, contacts: next });
                            }}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label>Email</Label>
                          <Input
                            value={c.email ?? ""}
                            onChange={(e) => {
                              const next = [...(d.contacts ?? [])];
                              next[idx] = { ...c, email: e.target.value };
                              setDraft({ ...d, contacts: next });
                            }}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label>Phone</Label>
                          <Input
                            value={c.phone ?? ""}
                            onChange={(e) => {
                              const next = [...(d.contacts ?? [])];
                              next[idx] = { ...c, phone: e.target.value };
                              setDraft({ ...d, contacts: next });
                            }}
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex justify-end">
                        <Button
                          variant="destructive"
                          className="rounded-xl"
                          onClick={() => {
                            const next = [...(d.contacts ?? [])];
                            next.splice(idx, 1);
                            setDraft({ ...d, contacts: next });
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-3">
              <Button variant="destructive" className="rounded-xl" onClick={del} disabled={deleting || saving}>
                {deleting ? "Deleting…" : "Delete profile"}
              </Button>
              <Button className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-900/90" onClick={save} disabled={saving || deleting}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

