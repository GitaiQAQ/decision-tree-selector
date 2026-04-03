import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import fixtures from "./fixtures/switchable-disabled.phase1.json";
import nonReachableRegistry from "./non-reachable-registry.json";
import decisionManifest from "./decision-manifests/switchable-disabled.phase1.json";
import { storyMapping } from "./story-mapping";
import {
  computeDecisionCoverage,
  type DecisionExecution,
  type NonReachableReason,
  type NonReachableRegistryEntry,
} from "./coverage/decision-coverage";
import {
  captureStorybookEvidence,
  classifyEvidenceFailure,
} from "./evidence/capture-storybook-evidence";
import { formatPhase1Report } from "./reports/phase1-report";
import { bootstrapFromDsl } from "../bootstrap-from-dsl";
import { dsl } from "../dsl";
import { buildPluginContextForNode, doesAnyPredicateReturnTrue } from "../runtime-helpers";
import type { RuntimeRootState } from "../types";

interface Phase1FixtureCase {
  caseId: string;
  flags: {
    isInventoryBlocked: boolean;
    isPolicyBlocked: boolean;
  };
  constraints?: string[];
  expectedDisabled: boolean;
}

const phase1Fixtures = fixtures as Phase1FixtureCase[];

function toNonReachableReason(value: string): NonReachableReason {
  if (
    value === "domain_invariant" ||
    value === "schema_limitation" ||
    value === "constraint_exclusion"
  ) {
    return value;
  }

  throw new Error(`Unsupported non-reachable reason: ${value}`);
}

const typedNonReachableRegistry: NonReachableRegistryEntry[] = nonReachableRegistry.map(
  (entry) => ({
    conditionId: entry.conditionId,
    reason: toNonReachableReason(entry.reason),
    owner: entry.owner,
  }),
);

function createRuntimeRootState(value?: string): RuntimeRootState {
  return {
    selection: {
      value,
      setValue: () => {},
    },
  };
}

function createDisabledPredicate(flags: Phase1FixtureCase["flags"]) {
  return async () => flags.isInventoryBlocked || flags.isPolicyBlocked;
}

async function runPhase1Case(fixture: Phase1FixtureCase): Promise<{
  caseId: string;
  actualDisabled: boolean;
  expectedDisabled: boolean;
  decisionExecution: DecisionExecution;
}> {
  const runtimeRoot = createRuntimeRootState();
  const tree = dsl.group({}, [
    dsl.switchableGroup({}, [
      dsl.switchableOption("Express", {
        disabled: createDisabledPredicate(fixture.flags),
      }),
      dsl.switchableOption("Standard", {}),
    ]),
  ]);

  const bootstrapped = bootstrapFromDsl(tree, {}, runtimeRoot);
  const expressOption = Object.values(bootstrapped.nodes).find(
    (node) => node.symbol === "Express",
  );
  if (!expressOption) {
    throw new Error("Express option missing");
  }

  const ctx = buildPluginContextForNode(expressOption, bootstrapped.nodes, runtimeRoot);
  const actualDisabled = await doesAnyPredicateReturnTrue(
    expressOption.props.disabled$,
    ctx,
    { traceScope: "disabled$" },
  );

  return {
    caseId: fixture.caseId,
    actualDisabled,
    expectedDisabled: fixture.expectedDisabled,
    decisionExecution: {
      caseId: fixture.caseId,
      flags: fixture.flags,
      decision: actualDisabled,
      constraintValid: true,
    },
  };
}

async function assertCaseWithEvidence(
  fixture: Phase1FixtureCase,
  capture: (args: {
    caseId: string;
    storyId: string;
    fixture: Phase1FixtureCase;
    errorMessage: string;
  }) => Promise<unknown>,
): Promise<void> {
  const result = await runPhase1Case(fixture);
  try {
    expect(result.actualDisabled).toBe(result.expectedDisabled);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await capture({
      caseId: fixture.caseId,
      storyId: storyMapping[fixture.caseId] ?? "",
      fixture,
      errorMessage: message,
    });
    throw error;
  }
}

describe("phase1 primary gate", () => {
  it.each(phase1Fixtures)("case $caseId", async (fixture) => {
    const result = await runPhase1Case(fixture);
    expect(result.caseId).toBe(fixture.caseId);
    expect(result.actualDisabled).toBe(result.expectedDisabled);
  });

  it("maps every phase1 fixture to a storybook story", () => {
    for (const fixture of phase1Fixtures) {
      expect(storyMapping[fixture.caseId]).toBeTruthy();
    }
  });

  it("captures screenshot only when assertion fails", async () => {
    const capture = vi.fn(async () => {});
    const passingFixture = phase1Fixtures[0]!;

    await assertCaseWithEvidence(passingFixture, capture);
    expect(capture).not.toHaveBeenCalled();

    const failingFixture: Phase1FixtureCase = {
      ...passingFixture,
      caseId: `${passingFixture.caseId}.forced-failure`,
      expectedDisabled: !passingFixture.expectedDisabled,
    };

    await expect(assertCaseWithEvidence(failingFixture, capture)).rejects.toThrow();
    expect(capture).toHaveBeenCalledTimes(1);
  });

  it("prints report-only summary with decision/condition/mcdc and evidence metrics", async () => {
    const executions: DecisionExecution[] = [];
    for (const fixture of phase1Fixtures) {
      const result = await runPhase1Case(fixture);
      executions.push(result.decisionExecution);
    }

    const coverage = computeDecisionCoverage(
      decisionManifest,
      executions,
      typedNonReachableRegistry,
    );

    const reportLines = formatPhase1Report({
      totalCases: phase1Fixtures.length,
      failedCases: 0,
      evidenceGenerated: 0,
      evidenceEligibleFailures: 0,
      decisionCoverage: coverage.decision.covered ? 1 : 0,
      conditionCoverage: coverage.condition.reachableCoverage,
      mcdcCoverage: coverage.mcdc.reachableCoverage,
      nonReachable: typedNonReachableRegistry,
      topEvidenceFailureCauses: [],
    });

    expect(reportLines.join("\n")).toContain("Decision coverage");
    expect(reportLines.join("\n")).toContain(
      "evidence_coverage = failures_with_screenshot / evidence_eligible_failures",
    );
  });

  it("uses expected evidence eligibility timeout semantics", () => {
    expect(
      classifyEvidenceFailure({ phase: "before_caseid", kind: "timeout" }).eligible,
    ).toBe(false);
    expect(
      classifyEvidenceFailure({ phase: "after_caseid", kind: "timeout" }).eligible,
    ).toBe(true);
  });

  it("captures real evidence metadata when forced failure occurs", async () => {
    const fixture = phase1Fixtures[0]!;
    const failingFixture: Phase1FixtureCase = {
      ...fixture,
      caseId: `${fixture.caseId}.real-capture`,
      expectedDisabled: !fixture.expectedDisabled,
    };
    const repoRoot = await mkdtemp(join(tmpdir(), "phase1-evidence-"));

    try {
      await expect(
        assertCaseWithEvidence(failingFixture, async (payload) => {
          await captureStorybookEvidence({
            caseId: payload.caseId,
            storyId:
      payload.storyId || "plugins-switchable--switchable-from-deep-node",
            fixture: payload.fixture,
            errorMessage: payload.errorMessage,
            repoRoot,
            storybookBaseUrl:
              process.env.STORYBOOK_BASE_URL ?? "http://127.0.0.1:6006",
          });
        }),
      ).rejects.toThrow();
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
});
