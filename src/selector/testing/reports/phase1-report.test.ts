import { describe, expect, it } from "vitest";

import { formatPhase1Report, type Phase1ReportInput } from "./phase1-report";

describe("phase1 report", () => {
  it("prints decision/condition/mcdc and evidence denominator details", () => {
    const sample: Phase1ReportInput = {
      totalCases: 10,
      failedCases: 2,
      evidenceGenerated: 1,
      evidenceEligibleFailures: 2,
      decisionCoverage: 1,
      conditionCoverage: 1,
      mcdcCoverage: 1,
      nonReachable: [],
      topEvidenceFailureCauses: [],
    };

    const output = formatPhase1Report(sample).join("\n");
    expect(output).toContain("Decision coverage");
    expect(output).toContain("Condition coverage");
    expect(output).toContain("MC/DC coverage");
    expect(output).toContain(
      "evidence_coverage = failures_with_screenshot / evidence_eligible_failures",
    );
  });

  it("prints warning and top failure causes when evidence target is missed", () => {
    const sample: Phase1ReportInput = {
      totalCases: 10,
      failedCases: 2,
      evidenceGenerated: 1,
      evidenceEligibleFailures: 2,
      decisionCoverage: 1,
      conditionCoverage: 1,
      mcdcCoverage: 1,
      nonReachable: [],
      topEvidenceFailureCauses: ["storybook timeout"],
    };

    const output = formatPhase1Report(sample).join("\n");
    expect(output).toContain("WARNING");
    expect(output).toContain("Top evidence failure causes");
  });
});
