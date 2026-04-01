import { useCallback } from "react";

import { useCurrentNodeId } from "../context/current-node";
import { useSelectable } from "../context/selectable";
import { useSelectorTree } from "../context/tree-provider";
import { switchAtNearestSwitchableAncestor } from "../plugins/switchable";
import type { SelectorSymbol } from "../types";

export interface UseSwitchableApi {
  switchFromNode: (
    nodeId: string,
    targetSymbol?: SelectorSymbol,
  ) => Promise<SelectorSymbol | undefined>;
  switchFromCurrentNode: (
    targetSymbol?: SelectorSymbol,
  ) => Promise<SelectorSymbol | undefined>;
}

export function useSwitchable(): UseSwitchableApi {
  const currentNodeId = useCurrentNodeId();
  const { nodes, runtimeRoot } = useSelectorTree();
  const { value, setValue } = useSelectable();

  const switchFromNode = useCallback(
    async (nodeId: string, targetSymbol?: SelectorSymbol) =>
      switchAtNearestSwitchableAncestor({
        nodeId,
        nodes,
        root: runtimeRoot,
        targetSymbol,
        setValue,
        previousValue: value,
      }),
    [nodes, runtimeRoot, setValue, value],
  );

  const switchFromCurrentNode = useCallback(
    async (targetSymbol?: SelectorSymbol) =>
      switchAtNearestSwitchableAncestor({
        nodeId: currentNodeId,
        nodes,
        root: runtimeRoot,
        targetSymbol,
        setValue,
        previousValue: value,
      }),
    [currentNodeId, nodes, runtimeRoot, setValue, value],
  );

  return {
    switchFromNode,
    switchFromCurrentNode,
  };
}
