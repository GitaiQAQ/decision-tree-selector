import type { RenderedNode, RuntimeNode } from "./types";

export type DebugSnapshotValue =
  | string
  | number
  | boolean
  | null
  | DebugSnapshotValue[]
  | { [key: string]: DebugSnapshotValue };

export interface RenderedNodeSnapshot {
  id: string;
  symbol: string;
  displayAs?: string;
  level: number;
  internalLevel: number;
  order: number;
  props: Record<string, DebugSnapshotValue>;
  children: RenderedNodeSnapshot[];
}

export interface RuntimeNodeSnapshot {
  id?: string;
  symbol: string;
  displayAs?: string;
  parentId?: string;
  index?: number;
  marks: string[];
  childIds: string[];
  selected: string[];
  selectedCount: number;
  nodeCreationStack?: string;
  props: Record<string, DebugSnapshotValue>;
}

export interface RuntimeNodeSnapshotOptions {
  includeNodeCreationStack?: boolean;
}

function snapshotObjectEntries(
  input: Record<string, unknown>,
  seen: WeakSet<object>,
): Record<string, DebugSnapshotValue> {
  const result: Record<string, DebugSnapshotValue> = {};

  for (const [key, value] of Object.entries(input)) {
    const snapshotValue = snapshotDebugValue(value, seen);
    if (snapshotValue !== undefined) {
      result[key] = snapshotValue;
    }
  }

  return result;
}

export function snapshotDebugValue(
  value: unknown,
  seen = new WeakSet<object>(),
): DebugSnapshotValue | undefined {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "bigint" || typeof value === "symbol") {
    return String(value);
  }

  if (typeof value === "function" || value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => snapshotDebugValue(item, seen))
      .filter((item): item is DebugSnapshotValue => item !== undefined);
  }

  if (!(value instanceof Object)) {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof RegExp) {
    return String(value);
  }

  if (seen.has(value)) {
    return "[Circular]";
  }

  seen.add(value);
  return snapshotObjectEntries(value as Record<string, unknown>, seen);
}

function snapshotRenderedNode(node: RenderedNode): RenderedNodeSnapshot {
  return {
    id: node.id,
    symbol: node.symbol,
    displayAs: node.displayAs,
    level: node.level,
    internalLevel: node.internalLevel,
    order: node.order,
    props: snapshotObjectEntries(node.props, new WeakSet<object>()),
    children: node.children.map(snapshotRenderedNode),
  };
}

export function snapshotRuntimeTree(root: RenderedNode): RenderedNodeSnapshot {
  return snapshotRenderedNode(root);
}

export function snapshotRuntimeNode(
  node: RuntimeNode,
  options: RuntimeNodeSnapshotOptions = {},
): RuntimeNodeSnapshot {
  const snapshot: RuntimeNodeSnapshot = {
    id: node.id,
    symbol: node.symbol,
    displayAs: node.displayAs,
    parentId: node.parentId,
    index: node.index,
    marks: [...(node.marks ?? [])],
    childIds: node.children
      .map((child) => child.id)
      .filter((childId): childId is string => typeof childId === "string"),
    selected: [...node.selected],
    selectedCount: node.selected.length,
    props: snapshotObjectEntries(node.props, new WeakSet<object>()),
  };

  if (options.includeNodeCreationStack && node.nodeCreationStack) {
    snapshot.nodeCreationStack = node.nodeCreationStack;
  }

  return snapshot;
}
