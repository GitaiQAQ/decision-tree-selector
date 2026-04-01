import { describe, expect, it } from "vitest";

import {
  clearDependencyTraces,
  resolveWithDependencyTracking,
} from "./dependency-tracker";
import { createMobxDependencyAdapter, type MobxLike } from "./mobx-adapter";
import { createNode } from "../create-node";
import { buildPluginContextForNode } from "../runtime-helpers";
import type { RuntimeRootState } from "../types";

function createRuntimeRootState(value?: string): RuntimeRootState {
  return {
    selection: {
      value,
      setValue: () => {},
    },
  };
}

function createMobxLikeMock(): MobxLike {
  const reactions = new Set<() => void>();

  const createBox = <T,>(initial: T) => {
    let value = initial;
    return {
      get() {
        return value;
      },
      set(nextValue: T) {
        value = nextValue;
        for (const reaction of reactions) {
          reaction();
        }
      },
    };
  };

  return {
    observable: {
      box: createBox,
    },
    autorun(effect) {
      reactions.add(effect);
      effect();
      return {
        dispose() {
          reactions.delete(effect);
        },
      };
    },
    runInAction(effect) {
      return effect();
    },
  };
}

describe("mobx dependency adapter", () => {
  it("receives emitted dependency traces and notifies autorun listeners", async () => {
    clearDependencyTraces();

    const mobx = createMobxLikeMock();
    const adapter = createMobxDependencyAdapter(mobx);

    const observedTraceIds: string[] = [];
    const stop = adapter.autorun((traces) => {
      observedTraceIds.push(...traces.map((trace) => trace.traceId));
    });

    const node = createNode("Root");
    node.id = "r";
    const runtimeRoot = createRuntimeRootState("Traffic");
    const context = buildPluginContextForNode(node, { r: node }, runtimeRoot);

    await resolveWithDependencyTracking("r::mobx-adapter", context, (trackedCtx) => {
      return trackedCtx.root.selection.value ?? "none";
    });

    expect(adapter.getVersion()).toBeGreaterThan(0);
    expect(adapter.getTraces().at(-1)?.traceId).toBe("r::mobx-adapter");
    expect(observedTraceIds).toContain("r::mobx-adapter");

    stop();
    adapter.dispose();
  });
});
