import { describe, expect, it } from "vitest";

import {
  computeDecisionCoverage,
  validateFixture,
  validateRegistry,
  type DecisionExecution,
  type DecisionManifest,
  type NonReachableRegistryEntry,
} from "./decision-coverage";

describe("phase1 coverage validators", () => {
  it("rejects invalid fixture and non-reachable records", () => {
    expect(() => validateFixture({ caseId: "", flags: {} })).toThrow();
    expect(() =>
      validateRegistry([{ conditionId: "c1" } as NonReachableRegistryEntry]),
    ).toThrow();
  });
});

describe("phase1 decision coverage", () => {
  it("requires MC/DC witness pair to differ in exactly one condition and flip decision", () => {
    const manifest: DecisionManifest = {
      decisionId: "switchable-disabled",
      conditions: [
        { id: "c_inventory", flag: "isInventoryBlocked" },
        { id: "c_policy", flag: "isPolicyBlocked" },
      ],
    };

    const executions: DecisionExecution[] = [
      {
        caseId: "c1",
        flags: { isInventoryBlocked: false, isPolicyBlocked: false },
        decision: false,
        constraintValid: true,
      },
      {
        caseId: "c2",
        flags: { isInventoryBlocked: true, isPolicyBlocked: false },
        decision: true,
        constraintValid: true,
      },
      {
        caseId: "c3",
        flags: { isInventoryBlocked: false, isPolicyBlocked: true },
        decision: true,
        constraintValid: true,
      },
    ];

    const report = computeDecisionCoverage(manifest, executions, []);

    expect(report.decision.covered).toBe(true);
    expect(report.condition.reachableCoverage).toBe(1);
    expect(report.mcdc.reachableCoverage).toBe(1);

    const inventoryWitness = report.mcdc.witnessPairs.find(
      (pair) => pair.conditionId === "c_inventory",
    );
    expect(inventoryWitness).toBeDefined();
    expect(inventoryWitness?.changedConditionIds).toEqual(["c_inventory"]);
    expect(inventoryWitness?.decisionBefore).not.toBe(inventoryWitness?.decisionAfter);
    expect(inventoryWitness?.constraintValid).toBe(true);
  });

  it("treats missing reason/owner as uncovered (not exempt)", () => {
    const manifest: DecisionManifest = {
      decisionId: "switchable-disabled",
      conditions: [{ id: "c_policy", flag: "isPolicyBlocked" }],
    };

    const executions: DecisionExecution[] = [
      {
        caseId: "only",
        flags: { isPolicyBlocked: false },
        decision: false,
        constraintValid: true,
      },
    ];

    const report = computeDecisionCoverage(manifest, executions, []);

    expect(report.condition.uncovered).toContain("c_policy");
  });
}
);
