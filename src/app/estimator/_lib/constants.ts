import type { MarketingChannel } from "@/lib/estimator/types";

export const CUSTOM_FEATURE_OPTIONS = [
  "Auth / login",
  "Payments",
  "Booking",
  "Integrations",
  "Admin dashboard",
  "Performance/SEO tuning",
] as const;

export const MARKETING_CHANNEL_OPTIONS: readonly MarketingChannel[] = [
  "Facebook Ads",
  "Google Ads",
  "SEO",
  "Social Media Management",
  "Email Marketing",
] as const;
