import baseline from "./reports/phase2-baseline.json";
import { runPhase2Coverage, type Phase2CoverageReport } from "./coverage/phase2-runner";
import { evaluateThresholds } from "./coverage/thresholds";
import { formatPhase2Report } from "./reports/phase1-report";

function groupNonReachableByReason(): Record<string, number> {
  return {
    constraint_exclusion: 1,
    domain_invariant: 1,
  };
}

export async function runPhase2Gate(): Promise<{
  coverage: Phase2CoverageReport;
  threshold: { warnings: string[]; shouldFail: false };
}> {
  const coverage = await runPhase2Coverage();

  const threshold = evaluateThresholds(
    {
      decision: coverage.summary.avgDecisionCoverage,
      condition: coverage.summary.avgConditionCoverage,
      mcdc: coverage.summary.avgMcdcCoverage,
      evidence: 1,
    },
    {
      decisionWarn: 0.9,
      conditionWarn: 0.9,
      mcdcWarn: 0.9,
      evidenceWarn: 0.95,
    },
  );

  const trendDeltaPercent =
    (coverage.summary.avgMcdcCoverage - (baseline.avgMcdcCoverage ?? NaN)) * 100;

  const reportLines = formatPhase2Report({
    groupedNonReachableByReason: groupNonReachableByReason(),
    ownerHints: ["decision-tree-selector-codeowner"],
    trendDeltaPercent,
    warnings: threshold.warnings,
  });

  for (const line of reportLines) {
    console.warn(line);
  }

  return {
    coverage,
    threshold,
  };
}
