import { describe, expect, it } from "vitest";

import { createNode } from "../create-node";
import { Meta } from "../meta";
import {
  buildPluginContextForNode,
  doesAnyPredicateReturnTrue,
} from "../runtime-helpers";
import type { RuntimeRootState } from "../types";
import {
  clearDependencyTraces,
  getDependencyTrace,
  resolveWithDependencyTracking,
} from "./dependency-tracker";

function createRuntimeRootState(value?: string): RuntimeRootState {
  return {
    selection: {
      value,
      setValue: () => {},
    },
  };
}

describe("dependency tracker", () => {
  it("captures nested property access paths via proxy tracking", async () => {
    clearDependencyTraces();

    const node = createNode("Root", {
      renderLabel: "Root",
    });
    node.id = "r";

    const runtimeRoot = createRuntimeRootState("Traffic");
    const context = buildPluginContextForNode(node, { r: node }, runtimeRoot);

    const resolved = await resolveWithDependencyTracking(
      "r::test-trace",
      context,
      (trackedContext) =>
        `${trackedContext.node.symbol}:${trackedContext.root.selection.value ?? "none"}`,
    );

    expect(resolved).toBe("Root:Traffic");

    const trace = getDependencyTrace("r::test-trace");
    expect(trace).toBeDefined();
    expect(trace?.dependencies).toContain("ctx.node.symbol");
    expect(trace?.dependencies).toContain("ctx.root.selection.value");
  });

  it("records trace ids when evaluating predicate arrays", async () => {
    clearDependencyTraces();

    const node = createNode("Traffic", {
      disabled: (ctx) => ctx.root.selection.value === "Traffic",
    });
    node.id = "r.c0";

    const runtimeRoot = createRuntimeRootState("Traffic");
    const context = buildPluginContextForNode(node, { [node.id]: node }, runtimeRoot);

    const disabled = await doesAnyPredicateReturnTrue(node.props[Meta.DISABLED], context, {
      traceScope: Meta.DISABLED,
    });

    expect(disabled).toBe(true);

    const trace = getDependencyTrace("r.c0::disabled$[0]");
    expect(trace).toBeDefined();
    expect(trace?.dependencies).toContain("ctx.root.selection.value");
  });
});
