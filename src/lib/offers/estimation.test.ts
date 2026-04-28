import { describe, expect, it } from "vitest";
import { estimateOffer } from "@/lib/offers/estimation";

describe("offers estimation", () => {
  it("computes a positive estimate for baseline website service", () => {
    const out = estimateOffer({
      category: "Website",
      complexity: "Medium",
      selectedServices: [{ name: "Website Development", category: "Web" }],
    });

    expect(out.estimatedHoursTotal).toBeGreaterThan(0);
    expect(out.estimatedTimelineDays).toBeGreaterThan(0);
    expect(out.suggestedPrice).toBeGreaterThan(0);
  });
});

