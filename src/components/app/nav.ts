export type NavItem = {
  href: string;
  label: string;
};

export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/estimator", label: "Estimator" },
  { href: "/offers", label: "Offers" },
  { href: "/projects", label: "Projects" },
  { href: "/revenue", label: "Revenue" },
];

// Future-ready: add more items here later.
export const FUTURE_NAV: NavItem[] = [];

