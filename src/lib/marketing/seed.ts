import type { MarketingClient, MonthlyRecord } from "@/lib/marketing/types";
import { monthKey, lastNMonths } from "@/lib/marketing/helpers";

function nowIso() {
  return new Date().toISOString();
}

function record(month: string, paymentStatus: "Paid" | "Unpaid" | "Late", paidAt?: string, notes?: string): MonthlyRecord {
  return {
    month,
    paid: paymentStatus === "Paid",
    paymentStatus,
    paidAt,
    notes,
  };
}

const thisMonth = monthKey();
const [m1, m2, m3, m4] = lastNMonths(4);

export const SEED_MARKETING_CLIENTS: MarketingClient[] = [
  {
    id: "mc_2001",
    clientName: "Aurum Clinic",
    services: ["Facebook Ads", "Google Ads"],
    monthlyFee: 1800,
    netAmount: 1450,
    creativesPerMonth: 6,
    owner: "Krasi",
    status: "Active",
    records: [
      record(m1, "Paid", new Date().toISOString()),
      record(m2, "Paid", new Date(Date.now() - 30 * 86400000).toISOString()),
      record(m3, "Paid", new Date(Date.now() - 60 * 86400000).toISOString()),
      record(m4, "Paid", new Date(Date.now() - 90 * 86400000).toISOString()),
      record(thisMonth, "Unpaid", undefined, "Awaiting invoice approval."),
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: "mc_2002",
    clientName: "Lumen Skincare",
    services: ["Google Ads", "Email Marketing"],
    monthlyFee: 2400,
    netAmount: 1950,
    creativesPerMonth: 8,
    owner: "Peter",
    status: "Active",
    records: [
      record(m1, "Paid", new Date(Date.now() - 10 * 86400000).toISOString()),
      record(m2, "Late", undefined, "Client requested invoice resend."),
      record(thisMonth, "Unpaid"),
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: "mc_2003",
    clientName: "Skyline Real Estate",
    services: ["SEO"],
    monthlyFee: 900,
    netAmount: 720,
    creativesPerMonth: 0,
    owner: "Team",
    status: "Active",
    records: [
      record(m1, "Paid", new Date(Date.now() - 18 * 86400000).toISOString()),
      record(thisMonth, "Late", undefined, "Pending content access + payment."),
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: "mc_2004",
    clientName: "Vela Foods",
    services: ["Social Media Management"],
    monthlyFee: 1200,
    netAmount: 980,
    creativesPerMonth: 12,
    owner: "Team",
    status: "Active",
    records: [record(thisMonth, "Paid", new Date(Date.now() - 2 * 86400000).toISOString())],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: "mc_2005",
    clientName: "Nordic Sauna BG",
    services: ["Facebook Ads"],
    monthlyFee: 800,
    netAmount: 650,
    creativesPerMonth: 4,
    owner: "Peter",
    status: "Paused",
    records: [record(thisMonth, "Unpaid", undefined, "Paused pending seasonality review.")],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: "mc_2006",
    clientName: "Bloom Dental Studio",
    services: ["SEO", "Google Ads"],
    monthlyFee: 1600,
    netAmount: 1300,
    creativesPerMonth: 5,
    owner: "Krasi",
    status: "Active",
    records: [record(thisMonth, "Unpaid")],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

