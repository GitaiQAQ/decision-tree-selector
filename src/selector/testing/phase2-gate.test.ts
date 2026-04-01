import { describe, expect, it } from "vitest";

import { runPhase2Gate } from "./phase2-gate";

describe("phase2 gate", () => {
  it("runs phase2 gate and emits report-only warnings", async () => {
    const result = await runPhase2Gate();

    expect(result.coverage.summary.totalRules).toBeGreaterThanOrEqual(2);
    expect(result.threshold.shouldFail).toBe(false);
  });
});
