export interface NonReachableRecord {
  conditionId: string;
  reason: "domain_invariant" | "schema_limitation" | "constraint_exclusion";
  owner: string;
}

export interface Phase1ReportInput {
  totalCases: number;
  failedCases: number;
  evidenceGenerated: number;
  evidenceEligibleFailures: number;
  decisionCoverage: number;
  conditionCoverage: number;
  mcdcCoverage: number;
  nonReachable: NonReachableRecord[];
  topEvidenceFailureCauses: string[];
}

export function formatPhase2Report(input: {
  groupedNonReachableByReason: Record<string, number>;
  ownerHints: string[];
  trendDeltaPercent: number;
  warnings: string[];
}): string[] {
  const lines: string[] = [];
  lines.push(
    `non-reachable by reason: ${JSON.stringify(input.groupedNonReachableByReason)}`,
  );
  lines.push(`owner hints: ${input.ownerHints.join(", ") || "none"}`);
  if (Number.isFinite(input.trendDeltaPercent)) {
    lines.push(`trend delta (vs baseline): ${input.trendDeltaPercent.toFixed(1)}%`);
  } else {
    lines.push("trend delta: unavailable");
  }
  for (const warning of input.warnings) {
    lines.push(`WARNING: ${warning}`);
  }
  return lines;
}

export function formatPhase1Report(input: Phase1ReportInput): string[] {
  const evidenceCoverage =
    input.evidenceEligibleFailures === 0
      ? 1
      : input.evidenceGenerated / input.evidenceEligibleFailures;

  const lines = [
    `total cases: ${input.totalCases}`,
    `failed cases: ${input.failedCases}`,
    `Decision coverage: ${(input.decisionCoverage * 100).toFixed(1)}%`,
    `Condition coverage: ${(input.conditionCoverage * 100).toFixed(1)}%`,
    `MC/DC coverage: ${(input.mcdcCoverage * 100).toFixed(1)}%`,
    `evidence_coverage = failures_with_screenshot / evidence_eligible_failures = ${input.evidenceGenerated} / ${input.evidenceEligibleFailures} (${(evidenceCoverage * 100).toFixed(1)}%)`,
  ];

  if (input.nonReachable.length > 0) {
    lines.push("non-reachable registry:");
    for (const record of input.nonReachable) {
      lines.push(
        `- ${record.conditionId}: ${record.reason} (owner: ${record.owner})`,
      );
    }
  }

  if (evidenceCoverage < 0.95) {
    lines.push("WARNING: evidence coverage below 95% target (report-only in Phase 1)");
  }

  if (input.topEvidenceFailureCauses.length > 0) {
    lines.push("Top evidence failure causes:");
    for (const cause of input.topEvidenceFailureCauses) {
      lines.push(`- ${cause}`);
    }
  }

  return lines;
}
