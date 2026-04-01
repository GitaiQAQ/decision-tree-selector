import { describe, expect, it } from "vitest";

import { getRuntimeNodePathIds, snapshotSelectorState } from "./debug";
import { bootstrapFromDsl } from "./bootstrap-from-dsl";
import { createNode } from "./create-node";
import { dsl } from "./dsl";
import { snapshotRuntimeNode } from "./snapshot-runtime-tree";
import type { RuntimeRootState } from "./types";

function createRuntimeRootState(value?: string): RuntimeRootState {
  return {
    selection: {
      value,
      setValue: () => {},
    },
  };
}

describe("selector debug api", () => {
  it("captures a stable selector state snapshot", () => {
    const tree = dsl.group({}, [
      createNode(
        "Objective",
        {
          renderLabel: "Objective",
        },
        [
          createNode("Traffic", {
            renderDescription: "Drive visits",
            marks: ["preferred"],
            payload: {
              channel: "web",
              retries: 2,
            },
          }),
        ],
      ),
    ]);

    const runtimeRoot = createRuntimeRootState("Traffic");
    const selectorTreeState = {
      ...bootstrapFromDsl(tree, {}, runtimeRoot),
      runtimeRoot,
    };

    const snapshot = snapshotSelectorState(selectorTreeState);

    expect(snapshot.selectedValue).toBe("Traffic");
    expect(snapshot.summary.runtimeNodeCount).toBe(3);
    expect(snapshot.summary.renderedNodeCount).toBe(3);
    expect(snapshot.nodes.map((node) => node.id)).toEqual([
      "r",
      "r.c0",
      "r.c0.c0",
    ]);
    expect(snapshot.nodes[2]).toMatchObject({
      id: "r.c0.c0",
      symbol: "Traffic",
      marks: ["preferred"],
      childIds: [],
      selectedCount: 1,
      props: {
        renderDescription: "Drive visits",
        payload: {
          channel: "web",
          retries: 2,
        },
      },
    });
    expect(snapshot.nodes[2]?.props.hidden$).toEqual([]);
    expect(snapshot.nodes[2]?.props.disabled$).toEqual([]);
    expect(snapshot.nodes[2]).not.toHaveProperty("nodeCreationStack");
  });

  it("returns the runtime node path from root to a node id", () => {
    const tree = dsl.group({}, [
      createNode("Objective", {}, [
        createNode("Traffic", {}),
        createNode("Reach", {}),
      ]),
    ]);

    const runtimeRoot = createRuntimeRootState();
    const selectorTreeState = {
      ...bootstrapFromDsl(tree, {}, runtimeRoot),
      runtimeRoot,
    };

    expect(getRuntimeNodePathIds(selectorTreeState.nodes, "r.c0.c1")).toEqual([
      "r",
      "r.c0",
      "r.c0.c1",
    ]);
    expect(getRuntimeNodePathIds(selectorTreeState.nodes, "missing")).toEqual(
      [],
    );
  });

  it("keeps node creation stack opt-in", () => {
    const tree = dsl.group({}, [createNode("Traffic", {})]);
    const runtimeRoot = createRuntimeRootState();
    const selectorTreeState = {
      ...bootstrapFromDsl(tree, {}, runtimeRoot),
      runtimeRoot,
    };
    const trafficNode = selectorTreeState.nodes["r.c0"];

    expect(snapshotRuntimeNode(trafficNode)).not.toHaveProperty(
      "nodeCreationStack",
    );
    expect(
      snapshotRuntimeNode(trafficNode, { includeNodeCreationStack: true }),
    ).toHaveProperty("nodeCreationStack");
  });
});
