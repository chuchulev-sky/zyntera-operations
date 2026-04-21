"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MenuIcon, PlusIcon } from "lucide-react";
import { NewOfferModal } from "@/components/offers/new-offer-modal";
import { NewCommitmentProjectModal } from "@/components/projects/new-commitment-project-modal";
import { PRIMARY_NAV } from "@/components/app/nav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [addOfferOpen, setAddOfferOpen] = React.useState(false);
  const [addProjectOpen, setAddProjectOpen] = React.useState(false);

  return (
    <div className="min-h-screen zyntera-surface">
      <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <span className="text-[11px] font-semibold tracking-[0.18em] text-zinc-900">
                ZD
              </span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight text-zinc-900">
                Zyntera Operations
              </div>
              <div className="text-xs text-zinc-500">Internal project flow</div>
            </div>
          </div>

          <nav className="hidden items-center gap-1 sm:flex">
            {PRIMARY_NAV.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100/70 hover:text-zinc-900",
                    active && "bg-zinc-100/80 text-zinc-900"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-xl border border-zinc-200 bg-white/70 px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-white">
                  <span className="inline-flex items-center gap-2">
                    <MenuIcon className="h-4 w-4" />
                    Menu
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {PRIMARY_NAV.map((item) => (
                    <DropdownMenuItem key={item.href}>
                      <Link href={item.href} className="w-full">
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-xl border border-zinc-200 bg-white/70 px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-white">
                <span className="inline-flex items-center gap-2">
                  <PlusIcon className="h-4 w-4" />
                  Add
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setAddOfferOpen(true)}>Offer</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAddProjectOpen(true)}>Project</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/revenue")}>Revenue</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>

      <NewOfferModal open={addOfferOpen} onOpenChange={setAddOfferOpen} />
      <NewCommitmentProjectModal open={addProjectOpen} onOpenChange={setAddProjectOpen} />
    </div>
  );
}

