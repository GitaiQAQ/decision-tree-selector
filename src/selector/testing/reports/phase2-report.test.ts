import { describe, expect, it } from "vitest";

import { formatPhase2Report } from "./phase1-report";

describe("phase2 report", () => {
  it("prints grouped non-reachable summary and owner hints", () => {
    const lines = formatPhase2Report({
      groupedNonReachableByReason: {
        domain_invariant: 1,
        schema_limitation: 2,
      },
      ownerHints: ["decision-tree-selector-codeowner"],
      trendDeltaPercent: 3.2,
      warnings: ["mcdc below threshold"],
    }).join("\n");

    expect(lines).toContain("non-reachable by reason");
    expect(lines).toContain("owner hints");
    expect(lines).toContain("trend delta");
  });
});
