import { describe, expect, it } from "vitest";

import {
  buildEvidencePaths,
  classifyEvidenceFailure,
} from "./capture-storybook-evidence";

describe("evidence eligibility classification", () => {
  it("classifies timeout before caseId resolution as infrastructure failure", () => {
    expect(
      classifyEvidenceFailure({
        phase: "before_caseid",
        kind: "timeout",
      }).eligible,
    ).toBe(false);
  });

  it("classifies timeout after caseId resolution as evidence-eligible", () => {
    expect(
      classifyEvidenceFailure({
        phase: "after_caseid",
        kind: "timeout",
      }).eligible,
    ).toBe(true);
  });

  it("resolves artifact path from repo root", () => {
    const paths = buildEvidencePaths({
      caseId: "c1",
      repoRoot: "/repo",
      cwd: "/repo/subdir",
    });

    expect(paths.screenshotPath).toBe("/repo/artifacts/phase1-evidence/c1.png");
    expect(paths.metadataPath).toBe("/repo/artifacts/phase1-evidence/c1.json");
  });
});
