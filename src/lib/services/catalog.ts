export type ServiceCategory = "Web" | "Design" | "Marketing";

export type ServiceOption = {
  name: string;
  category: ServiceCategory;
};

export const SERVICE_CATALOG: ServiceOption[] = [
  // Web
  { name: "Website Development", category: "Web" },
  { name: "E-commerce", category: "Web" },
  { name: "Custom Web App", category: "Web" },
  // Design
  { name: "UI/UX Design", category: "Design" },
  { name: "Branding", category: "Design" },
  // Marketing
  { name: "Facebook Ads", category: "Marketing" },
  { name: "Google Ads", category: "Marketing" },
  { name: "SEO", category: "Marketing" },
  { name: "Social Media Management", category: "Marketing" },
  { name: "Email Marketing", category: "Marketing" },
];

export function groupServices(options: ServiceOption[]) {
  return options.reduce(
    (acc, s) => {
      acc[s.category].push(s);
      return acc;
    },
    { Web: [] as ServiceOption[], Design: [] as ServiceOption[], Marketing: [] as ServiceOption[] }
  );
}

