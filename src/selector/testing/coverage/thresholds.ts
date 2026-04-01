export function evaluateThresholds(
  coverage: {
    decision: number;
    condition: number;
    mcdc: number;
    evidence: number;
  },
  thresholds: {
    decisionWarn: number;
    conditionWarn: number;
    mcdcWarn: number;
    evidenceWarn: number;
  },
): { warnings: string[]; shouldFail: false } {
  const warnings: string[] = [];

  if (coverage.decision < thresholds.decisionWarn) {
    warnings.push(
      `decision coverage ${(coverage.decision * 100).toFixed(1)}% below warn threshold ${(thresholds.decisionWarn * 100).toFixed(1)}%`,
    );
  }

  if (coverage.condition < thresholds.conditionWarn) {
    warnings.push(
      `condition coverage ${(coverage.condition * 100).toFixed(1)}% below warn threshold ${(thresholds.conditionWarn * 100).toFixed(1)}%`,
    );
  }

  if (coverage.mcdc < thresholds.mcdcWarn) {
    warnings.push(
      `MC/DC coverage ${(coverage.mcdc * 100).toFixed(1)}% below warn threshold ${(thresholds.mcdcWarn * 100).toFixed(1)}%`,
    );
  }

  if (coverage.evidence < thresholds.evidenceWarn) {
    warnings.push(
      `evidence coverage ${(coverage.evidence * 100).toFixed(1)}% below warn threshold ${(thresholds.evidenceWarn * 100).toFixed(1)}%`,
    );
  }

  return { warnings, shouldFail: false };
}
