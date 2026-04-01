import { useMemo } from "react";

import {
  useSelectorTree,
  type SelectorTreeState,
} from "./context/tree-provider";
import {
  snapshotRuntimeNode,
  snapshotRuntimeTree,
  type RenderedNodeSnapshot,
  type RuntimeNodeSnapshotOptions,
  type RuntimeNodeSnapshot,
} from "./snapshot-runtime-tree";
import {
  getDependencyTrace,
  listDependencyTracesByPrefix,
  type DependencyTrace,
} from "./tracking/dependency-tracker";
import type { RenderedNode, RuntimeNode, SelectorSymbol } from "./types";

export interface SelectorDebugSnapshot {
  selectedValue: SelectorSymbol | null;
  summary: {
    renderedNodeCount: number;
    runtimeNodeCount: number;
  };
  root: RenderedNodeSnapshot;
  nodes: RuntimeNodeSnapshot[];
}

export interface SelectorDebugApi {
  getRuntimeNodePathIds: (nodeId: string) => string[];
  snapshotRuntimeNodeById: (
    nodeId: string,
    options?: RuntimeNodeSnapshotOptions,
  ) => RuntimeNodeSnapshot | undefined;
  getDependencyTrace: (traceId: string) => DependencyTrace | undefined;
  listNodeDependencyTraces: (nodeId: string) => DependencyTrace[];
  snapshotState: () => SelectorDebugSnapshot;
}

function countRenderedNodes(node: RenderedNode): number {
  return (
    1 +
    node.children.reduce((count, child) => count + countRenderedNodes(child), 0)
  );
}

function getRuntimeNodeById(
  nodes: Record<string, RuntimeNode>,
  nodeId: string,
): RuntimeNode | undefined {
  return nodes[nodeId];
}

export function getRuntimeNodePathIds(
  nodes: Record<string, RuntimeNode>,
  nodeId: string,
): string[] {
  const path: string[] = [];
  let currentNode = getRuntimeNodeById(nodes, nodeId);

  while (currentNode) {
    if (currentNode.id) {
      path.unshift(currentNode.id);
    }
    currentNode = currentNode.getParent?.();
  }

  return path;
}

export function snapshotSelectorState(
  selectorTreeState: SelectorTreeState,
): SelectorDebugSnapshot {
  const nodeIds = Object.keys(selectorTreeState.nodes).sort();

  return {
    selectedValue: selectorTreeState.runtimeRoot.selection.value ?? null,
    summary: {
      renderedNodeCount: countRenderedNodes(selectorTreeState.root),
      runtimeNodeCount: nodeIds.length,
    },
    root: snapshotRuntimeTree(selectorTreeState.root),
    nodes: nodeIds.map((nodeId) =>
      snapshotRuntimeNode(selectorTreeState.nodes[nodeId]!),
    ),
  };
}

export function createSelectorDebugApi(
  selectorTreeState: SelectorTreeState,
): SelectorDebugApi {
  return {
    getRuntimeNodePathIds(nodeId) {
      return getRuntimeNodePathIds(selectorTreeState.nodes, nodeId);
    },
    snapshotRuntimeNodeById(nodeId, options) {
      const node = getRuntimeNodeById(selectorTreeState.nodes, nodeId);
      return node ? snapshotRuntimeNode(node, options) : undefined;
    },
    getDependencyTrace(traceId) {
      return getDependencyTrace(traceId);
    },
    listNodeDependencyTraces(nodeId) {
      return listDependencyTracesByPrefix(`${nodeId}::`);
    },
    snapshotState() {
      return snapshotSelectorState(selectorTreeState);
    },
  };
}

export function useSelectorDebug(): SelectorDebugApi {
  const selectorTreeState = useSelectorTree();

  return useMemo(
    () => createSelectorDebugApi(selectorTreeState),
    [selectorTreeState],
  );
}
