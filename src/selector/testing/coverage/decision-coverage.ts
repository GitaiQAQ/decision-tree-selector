export interface DecisionManifestCondition {
  id: string;
  flag: string;
}

export interface DecisionManifest {
  decisionId: string;
  conditions: DecisionManifestCondition[];
}

export interface DecisionExecution {
  caseId: string;
  flags: Record<string, boolean>;
  decision: boolean;
  constraintValid: boolean;
}

export type NonReachableReason =
  | "domain_invariant"
  | "schema_limitation"
  | "constraint_exclusion";

export interface NonReachableRegistryEntry {
  conditionId: string;
  reason: NonReachableReason;
  owner: string;
}

export interface McdcWitnessPair {
  conditionId: string;
  beforeCaseId: string;
  afterCaseId: string;
  changedConditionIds: string[];
  decisionBefore: boolean;
  decisionAfter: boolean;
  constraintValid: boolean;
}

export interface DecisionCoverageReport {
  decision: {
    seenTrue: boolean;
    seenFalse: boolean;
    covered: boolean;
  };
  condition: {
    reachable: string[];
    nonReachable: string[];
    uncovered: string[];
    reachableCoverage: number;
  };
  mcdc: {
    coveredConditions: string[];
    missingConditions: string[];
    witnessPairs: McdcWitnessPair[];
    reachableCoverage: number;
  };
}

function assertNonEmptyString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string`);
  }
}

function isNonReachableReason(value: unknown): value is NonReachableReason {
  return (
    value === "domain_invariant" ||
    value === "schema_limitation" ||
    value === "constraint_exclusion"
  );
}

export function validateFixture(fixture: {
  caseId?: unknown;
  flags?: unknown;
}): void {
  assertNonEmptyString(fixture.caseId, "fixture.caseId");
  if (
    fixture.flags == null ||
    typeof fixture.flags !== "object" ||
    Array.isArray(fixture.flags)
  ) {
    throw new Error("fixture.flags must be an object");
  }
}

export function validateRegistry(registry: NonReachableRegistryEntry[]): void {
  for (const [index, entry] of registry.entries()) {
    assertNonEmptyString(entry.conditionId, `registry[${index}].conditionId`);
    if (!isNonReachableReason(entry.reason)) {
      throw new Error(`registry[${index}].reason must be a valid taxonomy value`);
    }
    assertNonEmptyString(entry.owner, `registry[${index}].owner`);
  }
}

function hasConditionToggle(
  executions: DecisionExecution[],
  flag: string,
): { hasTrue: boolean; hasFalse: boolean } {
  let hasTrue = false;
  let hasFalse = false;
  for (const execution of executions) {
    const value = Boolean(execution.flags[flag]);
    if (value) {
      hasTrue = true;
    } else {
      hasFalse = true;
    }
  }
  return { hasTrue, hasFalse };
}

function changedConditionIds(
  left: DecisionExecution,
  right: DecisionExecution,
  manifest: DecisionManifest,
): string[] {
  return manifest.conditions
    .filter(
      (condition) =>
        Boolean(left.flags[condition.flag]) !== Boolean(right.flags[condition.flag]),
    )
    .map((condition) => condition.id);
}

export function computeDecisionCoverage(
  manifest: DecisionManifest,
  executions: DecisionExecution[],
  registry: NonReachableRegistryEntry[],
): DecisionCoverageReport {
  validateRegistry(registry);

  const validExecutions = executions.filter((execution) => execution.constraintValid);

  const seenTrue = validExecutions.some((execution) => execution.decision === true);
  const seenFalse = validExecutions.some((execution) => execution.decision === false);

  const registryByCondition = new Map(
    registry.map((entry) => [entry.conditionId, entry]),
  );

  const reachable: string[] = [];
  const nonReachable: string[] = [];
  const uncovered: string[] = [];

  for (const condition of manifest.conditions) {
    const toggle = hasConditionToggle(validExecutions, condition.flag);
    const canToggle = toggle.hasTrue && toggle.hasFalse;

    if (canToggle) {
      reachable.push(condition.id);
      continue;
    }

    nonReachable.push(condition.id);
    const exemption = registryByCondition.get(condition.id);
    if (!exemption) {
      uncovered.push(condition.id);
    }
  }

  const witnessPairs: McdcWitnessPair[] = [];
  const coveredConditions = new Set<string>();

  for (const condition of manifest.conditions) {
    if (!reachable.includes(condition.id)) {
      continue;
    }

    let found = false;

    for (let i = 0; i < validExecutions.length && !found; i += 1) {
      for (let j = i + 1; j < validExecutions.length && !found; j += 1) {
        const before = validExecutions[i]!;
        const after = validExecutions[j]!;

        const changed = changedConditionIds(before, after, manifest);
        const isSingleConditionChange =
          changed.length === 1 && changed[0] === condition.id;
        const decisionFlipped = before.decision !== after.decision;

        if (!isSingleConditionChange || !decisionFlipped) {
          continue;
        }

        witnessPairs.push({
          conditionId: condition.id,
          beforeCaseId: before.caseId,
          afterCaseId: after.caseId,
          changedConditionIds: changed,
          decisionBefore: before.decision,
          decisionAfter: after.decision,
          constraintValid: true,
        });
        coveredConditions.add(condition.id);
        found = true;
      }
    }
  }

  const reachableConditionTotal = reachable.length;
  const reachableConditionCovered =
    reachableConditionTotal - uncovered.filter((id) => reachable.includes(id)).length;

  const mcdcCoveredCount = coveredConditions.size;

  return {
    decision: {
      seenTrue,
      seenFalse,
      covered: seenTrue && seenFalse,
    },
    condition: {
      reachable,
      nonReachable,
      uncovered,
      reachableCoverage:
        reachableConditionTotal === 0
          ? 1
          : reachableConditionCovered / reachableConditionTotal,
    },
    mcdc: {
      coveredConditions: [...coveredConditions],
      missingConditions: reachable.filter((id) => !coveredConditions.has(id)),
      witnessPairs,
      reachableCoverage:
        reachableConditionTotal === 0
          ? 1
          : mcdcCoveredCount / reachableConditionTotal,
    },
  };
}
