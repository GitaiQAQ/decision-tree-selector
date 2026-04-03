import { describe, expect, it } from "vitest";

import { bootstrapFromDsl } from "./bootstrap-from-dsl";
import { createNode } from "./create-node";
import { dsl } from "./dsl";
import { Meta } from "./meta";
import { childVisibilityMutex } from "./plugins/child-visibility-mutex";
import {
  resolveSwitchableTarget,
  switchAtNearestSwitchableAncestor,
} from "./plugins/switchable";
import {
  buildPluginContextForNode,
  doesAnyPredicateReturnTrue,
  resolveValueFromMaybeDynamicFunctionOrPromise,
} from "./runtime-helpers";
import { SWITCHABLE_MARKS, type RuntimeRootState } from "./types";

function createRuntimeRootState(value?: string): RuntimeRootState {
  return {
    selection: {
      value,
      setValue: () => {},
    },
  };
}

describe("bootstrapFromDsl", () => {
  it("resolves container defaultOn to the first selectable leaf", async () => {
    const tree = dsl.group({}, [
      createNode("Awareness", {}, [
        createNode("Reach", {}),
        createNode("Traffic", {
          disabled: () => true,
        }),
      ]),
    ]);

    const runtimeRoot = createRuntimeRootState();
    const result = bootstrapFromDsl(tree, {}, runtimeRoot);
    const rootNode = result.nodes.r;
    const rootContext = buildPluginContextForNode(
      rootNode,
      result.nodes,
      runtimeRoot,
    );

    await expect(
      resolveValueFromMaybeDynamicFunctionOrPromise(
        rootNode.props[Meta.DEFAULT_ON],
        rootContext,
      ),
    ).resolves.toBe("Reach");
  });

  it("disables lower-priority siblings inside a mutex group", async () => {
    const tree = dsl.group({}, [
      createNode("Consideration", { plugins: [childVisibilityMutex] }, [
        createNode("Traffic", {}),
        createNode("App Promotion", {}),
      ]),
    ]);

    const runtimeRoot = createRuntimeRootState();
    const result = bootstrapFromDsl(tree, {}, runtimeRoot);
    const appPromotionNode = Object.values(result.nodes).find(
      (node) => node.symbol === "App Promotion",
    );

    expect(appPromotionNode).toBeDefined();
    const nodeContext = buildPluginContextForNode(
      appPromotionNode!,
      result.nodes,
      runtimeRoot,
    );
    await expect(
      doesAnyPredicateReturnTrue(
        appPromotionNode!.props[Meta.DISABLED],
        nodeContext,
      ),
    ).resolves.toBe(true);
  });

  it("keeps an option panel visible only while selection stays under its parent branch", async () => {
    const runtimeRoot = createRuntimeRootState("Export invoices");
    const tree = dsl.group({}, [
      dsl.node("Billing", {}, [
        dsl.optionPanel("Billing Advanced Scopes", {}, [
          createNode("Export invoices", {}),
        ]),
      ]),
      dsl.node("Analytics", {}, [createNode("View dashboards", {})]),
    ]);

    const result = bootstrapFromDsl(tree, {}, runtimeRoot);
    const panelNode = Object.values(result.nodes).find(
      (node) => node.symbol === "Billing Advanced Scopes",
    );

    expect(panelNode).toBeDefined();

    const panelContext = buildPluginContextForNode(
      panelNode!,
      result.nodes,
      runtimeRoot,
    );

    await expect(
      doesAnyPredicateReturnTrue(panelNode!.props[Meta.HIDDEN], panelContext),
    ).resolves.toBe(false);

    runtimeRoot.selection.value = "View dashboards";

    await expect(
      doesAnyPredicateReturnTrue(panelNode!.props[Meta.HIDDEN], panelContext),
    ).resolves.toBe(true);
  });

  it("unlocks the next mutex option when the higher-priority sibling is hidden", async () => {
    const runtimeRoot = createRuntimeRootState();
    const tree = dsl.group({}, [
      dsl.node("Consideration", { plugins: [childVisibilityMutex] }, [
        createNode("Traffic", {
          hidden: () => true,
        }),
        createNode("App Promotion", {}),
      ]),
    ]);

    const result = bootstrapFromDsl(tree, {}, runtimeRoot);
    const appPromotionNode = Object.values(result.nodes).find(
      (node) => node.symbol === "App Promotion",
    );

    expect(appPromotionNode).toBeDefined();

    const nodeContext = buildPluginContextForNode(
      appPromotionNode!,
      result.nodes,
      runtimeRoot,
    );

    await expect(
      doesAnyPredicateReturnTrue(
        appPromotionNode!.props[Meta.DISABLED],
        nodeContext,
      ),
    ).resolves.toBe(false);
  });

  it("switches from deep node to nearest switchable ancestor", async () => {
    let selectedValue: string | undefined;
    const runtimeRoot: RuntimeRootState = {
      selection: {
        value: "android-leaf",
        setValue: (nextValue) => {
          selectedValue = nextValue;
          runtimeRoot.selection.value = nextValue;
        },
      },
    };

    const tree = dsl.group({}, [
      createNode("Outside", {}),
      dsl.switchableGroup({}, [
        dsl.switchableOption("ios", {}, [createNode("ios-leaf", {})]),
        dsl.switchableOption("android", {}, [createNode("android-leaf", {})]),
      ]),
    ]);

    const result = bootstrapFromDsl(tree, {}, runtimeRoot);
    const androidLeaf = Object.values(result.nodes).find(
      (node) => node.symbol === "android-leaf",
    );

    expect(androidLeaf?.id).toBeDefined();

    const switchedTo = await switchAtNearestSwitchableAncestor({
      nodeId: androidLeaf!.id!,
      nodes: result.nodes,
      root: runtimeRoot,
      setValue: runtimeRoot.selection.setValue,
      previousValue: runtimeRoot.selection.value,
    });

    expect(switchedTo).toBe("ios-leaf");
    expect(selectedValue).toBe("ios-leaf");
  });

  it("uses default-marked switchable option when target is unavailable", async () => {
    const runtimeRoot = createRuntimeRootState("android");
    const tree = dsl.group({}, [
      dsl.switchableGroup({}, [
        dsl.switchableOption("ios", { default: true }),
        dsl.switchableOption("android", {
          hidden: () => true,
        }),
      ]),
    ]);

    const result = bootstrapFromDsl(tree, {}, runtimeRoot);
    const switchableGroupNode = Object.values(result.nodes).find((node) =>
      node.marks?.includes(SWITCHABLE_MARKS.GROUP),
    );

    expect(switchableGroupNode).toBeDefined();

    const context = buildPluginContextForNode(
      switchableGroupNode!,
      result.nodes,
      runtimeRoot,
    );

    await expect(
      resolveSwitchableTarget(context, { targetSymbol: "android" }),
    ).resolves.toBe("ios");
  });
});
