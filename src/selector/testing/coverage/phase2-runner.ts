import childVisibilityManifest from "../decision-manifests/child-visibility-mutex-disabled.phase2.json";
import switchableManifest from "../decision-manifests/switchable-disabled.phase1.json";
import childVisibilityFixtures from "../fixtures/child-visibility-mutex-disabled.phase2.json";
import switchableFixtures from "../fixtures/switchable-disabled.phase2.generated.json";
import nonReachableRegistry from "../non-reachable-registry.json";

import {
  computeDecisionCoverage,
  type DecisionExecution,
  type DecisionManifest,
  type NonReachableRegistryEntry,
} from "./decision-coverage";

export interface Phase2RuleCoverage {
  ruleId: string;
  decisionCoverage: number;
  conditionCoverage: number;
  mcdcCoverage: number;
}

export interface Phase2CoverageReport {
  rules: Phase2RuleCoverage[];
  summary: {
    totalRules: number;
    avgDecisionCoverage: number;
    avgConditionCoverage: number;
    avgMcdcCoverage: number;
  };
}

interface Phase2Fixture {
  caseId: string;
  ruleId: string;
  flags: Record<string, boolean>;
  constraints: string[];
  expectedDecision: boolean;
}

function fixtureToExecution(fixture: Phase2Fixture): DecisionExecution {
  return {
    caseId: fixture.caseId,
    flags: fixture.flags,
    decision: fixture.expectedDecision,
    constraintValid: true,
  };
}

function avg(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
}

export async function runPhase2Coverage(): Promise<Phase2CoverageReport> {
  const manifests: DecisionManifest[] = [
    switchableManifest as DecisionManifest,
    childVisibilityManifest as DecisionManifest,
  ];

  const allFixtures: Phase2Fixture[][] = [
    switchableFixtures as Phase2Fixture[],
    childVisibilityFixtures as Phase2Fixture[],
  ];

  const registry = nonReachableRegistry as NonReachableRegistryEntry[];

  const rules: Phase2RuleCoverage[] = manifests.map((manifest, index) => {
    const fixtures = allFixtures[index]!;
    const executions = fixtures.map(fixtureToExecution);
    const report = computeDecisionCoverage(manifest, executions, registry);

    return {
      ruleId: manifest.decisionId,
      decisionCoverage: report.decision.covered ? 1 : 0,
      conditionCoverage: report.condition.reachableCoverage,
      mcdcCoverage: report.mcdc.reachableCoverage,
    };
  });

  return {
    rules,
    summary: {
      totalRules: rules.length,
      avgDecisionCoverage: avg(rules.map((r) => r.decisionCoverage)),
      avgConditionCoverage: avg(rules.map((r) => r.conditionCoverage)),
      avgMcdcCoverage: avg(rules.map((r) => r.mcdcCoverage)),
    },
  };
}
