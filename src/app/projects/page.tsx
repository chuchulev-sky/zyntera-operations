"use client";

import * as React from "react";
import ProjectsPageClient from "./projects-page-client";

export default function ProjectsPage() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="py-10 text-center text-sm text-zinc-500">Loading commitments…</div>;
  }

  return <ProjectsPageClient />;
}
