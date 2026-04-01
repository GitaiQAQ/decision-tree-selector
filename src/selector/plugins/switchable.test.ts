import { describe, expect, it } from "vitest";

import { bootstrapFromDsl } from "../bootstrap-from-dsl";
import { createNode } from "../create-node";
import { dsl } from "../dsl";
import { VirtualNodeType } from "../meta";
import { childVisibilityMutex } from "./child-visibility-mutex";
import {
  findNearestSwitchableAncestor,
  resolveSwitchableTarget,
  switchAtNearestSwitchableAncestor,
  switchable,
} from "./switchable";
import {
  buildPluginContextForNode,
  resolveValueFromMaybeDynamicFunctionOrPromise,
} from "../runtime-helpers";
import type { RuntimeRootState } from "../types";

function createRuntimeRootState(value?: string): RuntimeRootState {
  return {
    selection: {
      value,
      setValue: () => {},
    },
  };
}

describe("switchable plugin", () => {
  it("finds nearest switchable ancestor", () => {
    const runtimeRoot = createRuntimeRootState();
    const tree = dsl.group({}, [
      dsl.switchableGroup({}, [
        dsl.switchableOption("A", {}, [createNode("A-leaf", {})]),
      ]),
    ]);

    const result = bootstrapFromDsl(tree, {}, runtimeRoot);
    const leaf = Object.values(result.nodes).find((node) => node.symbol === "A-leaf");

    expect(leaf).toBeDefined();
    expect(findNearestSwitchableAncestor(leaf)?.marks).toContain("switchable.group");
  });

  it("prefers switchable.default mark", async () => {
    const runtimeRoot = createRuntimeRootState("B");
    const tree = dsl.group({}, [
      dsl.switchableGroup({}, [
        dsl.switchableOption("A"),
        dsl.switchableOption("B", { default: true }),
      ]),
    ]);

    const result = bootstrapFromDsl(tree, {}, runtimeRoot);
    const groupNode = Object.values(result.nodes).find((node) =>
      node.marks?.includes("switchable.group"),
    );
    const ctx = buildPluginContextForNode(groupNode!, result.nodes, runtimeRoot);

    await expect(resolveSwitchableTarget(ctx)).resolves.toBe("B");
  });

  it("falls back to first selectable option", async () => {
    const runtimeRoot = createRuntimeRootState();
    const tree = dsl.group({}, [
      dsl.switchableGroup({}, [
        dsl.switchableOption("A"),
        dsl.switchableOption("B"),
      ]),
    ]);

    const result = bootstrapFromDsl(tree, {}, runtimeRoot);
    const groupNode = Object.values(result.nodes).find((node) =>
      node.marks?.includes("switchable.group"),
    );
    const ctx = buildPluginContextForNode(groupNode!, result.nodes, runtimeRoot);

    await expect(resolveSwitchableTarget(ctx)).resolves.toBe("A");
  });

  it("falls back to default-on strategy when no switchable option is selectable", async () => {
    const runtimeRoot = createRuntimeRootState();
    const tree = dsl.group({}, [
      dsl.switchableGroup({}, [
        dsl.switchableOption("A", { hidden: () => true }),
        dsl.switchableOption("B", { disabled: () => true }),
        createNode("Fallback", {}),
      ]),
    ]);

    const result = bootstrapFromDsl(tree, {}, runtimeRoot);
    const groupNode = Object.values(result.nodes).find((node) =>
      node.marks?.includes("switchable.group"),
    );
    const ctx = buildPluginContextForNode(groupNode!, result.nodes, runtimeRoot);

    await expect(resolveSwitchableTarget(ctx)).resolves.toBe("Fallback");
  });

  it("falls back when explicit target is hidden", async () => {
    const runtimeRoot = createRuntimeRootState("A");
    const tree = dsl.group({}, [
      dsl.switchableGroup({}, [
        dsl.switchableOption("A", { default: true }),
        dsl.switchableOption("B", { hidden: () => true }),
      ]),
    ]);

    const result = bootstrapFromDsl(tree, {}, runtimeRoot);
    const groupNode = Object.values(result.nodes).find((node) =>
      node.marks?.includes("switchable.group"),
    );
    const ctx = buildPluginContextForNode(groupNode!, result.nodes, runtimeRoot);

    await expect(
      resolveSwitchableTarget(ctx, { targetSymbol: "B" }),
    ).resolves.toBe("A");
  });

  it("coexists with mutex plugin and keeps predictable target resolution", async () => {
    const runtimeRoot = createRuntimeRootState();
    const tree = dsl.group({}, [
      createNode(
        VirtualNodeType.Fragment,
        {
          marks: ["switchable.group"],
          plugins: [childVisibilityMutex, switchable],
        },
        [dsl.switchableOption("A"), dsl.switchableOption("B")],
      ),
    ]);

    const result = bootstrapFromDsl(tree, {}, runtimeRoot);
    const groupNode = Object.values(result.nodes).find((node) =>
      node.marks?.includes("switchable.group"),
    );
    const ctx = buildPluginContextForNode(groupNode!, result.nodes, runtimeRoot);

    await expect(
      resolveSwitchableTarget(ctx, { targetSymbol: "B" }),
    ).resolves.toBe("A");
  });

  it("sets group defaultOn via plugin", async () => {
    const runtimeRoot = createRuntimeRootState();
    const tree = dsl.group({}, [
      dsl.switchableGroup({}, [dsl.switchableOption("A", { default: true })]),
    ]);

    const result = bootstrapFromDsl(tree, {}, runtimeRoot);
    const groupNode = Object.values(result.nodes).find((node) =>
      node.marks?.includes("switchable.group"),
    );
    const ctx = buildPluginContextForNode(groupNode!, result.nodes, runtimeRoot);

    await expect(
      resolveValueFromMaybeDynamicFunctionOrPromise(
        groupNode!.props.defaultOn$,
        ctx,
      ),
    ).resolves.toBe("A");
  });

  it("switches from deep node to next selectable option", async () => {
    const runtimeRoot = createRuntimeRootState("Standard deep leaf");
    let updatedValue: string | undefined;
    const tree = dsl.group({}, [
      dsl.node("Delivery Mode", {}, [
        dsl.switchableGroup({}, [
          dsl.switchableOption("Express", { default: true }, [
            dsl.mutexGroup({}, [
              dsl.optionMutex("Express + Locker"),
              dsl.optionMutex("Express + Door"),
            ]),
            dsl.node("Express deep leaf"),
          ]),
          dsl.switchableOption("Standard", {}, [dsl.node("Standard deep leaf")]),
          dsl.switchableOption("Hidden option", {
            hidden: () => true,
          }),
        ]),
      ]),
    ]);

    const result = bootstrapFromDsl(tree, {}, runtimeRoot);
    const deepNode = Object.values(result.nodes).find(
      (node) => node.symbol === "Standard deep leaf",
    );

    expect(deepNode).toBeDefined();

    const next = await switchAtNearestSwitchableAncestor({
      nodeId: deepNode!.id!,
      nodes: result.nodes,
      root: runtimeRoot,
      previousValue: runtimeRoot.selection.value,
      setValue: (nextValue) => {
        updatedValue = nextValue;
      },
    });

    expect(next).toBe("Express + Locker");
    expect(updatedValue).toBe("Express + Locker");
  });

  it("falls back when switching to hidden target symbol", async () => {
    const runtimeRoot = createRuntimeRootState("Standard deep leaf");
    let updatedValue: string | undefined;
    const tree = dsl.group({}, [
      dsl.node("Delivery Mode", {}, [
        dsl.switchableGroup({}, [
          dsl.switchableOption("Express", { default: true }, [
            dsl.mutexGroup({}, [
              dsl.optionMutex("Express + Locker"),
              dsl.optionMutex("Express + Door"),
            ]),
          ]),
          dsl.switchableOption("Standard", {}, [dsl.node("Standard deep leaf")]),
          dsl.switchableOption("Hidden option", {
            hidden: () => true,
          }),
        ]),
      ]),
    ]);

    const result = bootstrapFromDsl(tree, {}, runtimeRoot);
    const deepNode = Object.values(result.nodes).find(
      (node) => node.symbol === "Standard deep leaf",
    );

    expect(deepNode).toBeDefined();

    const next = await switchAtNearestSwitchableAncestor({
      nodeId: deepNode!.id!,
      nodes: result.nodes,
      root: runtimeRoot,
      targetSymbol: "Hidden option",
      previousValue: runtimeRoot.selection.value,
      setValue: (nextValue) => {
        updatedValue = nextValue;
      },
    });

    expect(next).toBe("Express + Locker");
    expect(updatedValue).toBe("Express + Locker");
  });

  it("switches from deep node to explicit standard target", async () => {
    const runtimeRoot = createRuntimeRootState("Express + Locker");
    let updatedValue: string | undefined;
    const tree = dsl.group({}, [
      dsl.node("Delivery Mode", {}, [
        dsl.switchableGroup({}, [
          dsl.switchableOption("Express", { default: true }, [
            dsl.mutexGroup({}, [
              dsl.optionMutex("Express + Locker"),
              dsl.optionMutex("Express + Door"),
            ]),
          ]),
          dsl.switchableOption("Standard", {}, [dsl.node("Standard deep leaf")]),
        ]),
      ]),
    ]);

    const result = bootstrapFromDsl(tree, {}, runtimeRoot);
    const deepNode = Object.values(result.nodes).find(
      (node) => node.symbol === "Express + Locker",
    );

    expect(deepNode).toBeDefined();

    const next = await switchAtNearestSwitchableAncestor({
      nodeId: deepNode!.id!,
      nodes: result.nodes,
      root: runtimeRoot,
      targetSymbol: "Standard",
      previousValue: runtimeRoot.selection.value,
      setValue: (nextValue) => {
        updatedValue = nextValue;
      },
    });

    expect(next).toBe("Standard deep leaf");
    expect(updatedValue).toBe("Standard deep leaf");
  });
});
