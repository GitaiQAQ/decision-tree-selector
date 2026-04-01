import type { PluginContext } from "../types";

export interface DependencyTrace {
  traceId: string;
  dependencies: string[];
  timestamp: number;
}

type DependencyTraceListener = (trace: DependencyTrace) => void;

const traceStore = new Map<string, DependencyTrace>();
const traceListeners = new Set<DependencyTraceListener>();

function isTrackableObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asDependencyPath(path: Array<string | number | symbol>): string {
  return path
    .map((segment) =>
      typeof segment === "symbol" ? `[${String(segment)}]` : String(segment),
    )
    .join(".");
}

function createTrackingProxy<T>(
  value: T,
  path: Array<string | number | symbol>,
  visited: WeakMap<object, unknown>,
  seenDependencies: Set<string>,
): T {
  if (!isTrackableObject(value)) {
    return value;
  }

  const cached = visited.get(value);
  if (cached) {
    return cached as T;
  }

  const proxy = new Proxy(value, {
    get(target, property, receiver) {
      if (typeof property !== "symbol" || property !== Symbol.toStringTag) {
        seenDependencies.add(asDependencyPath([...path, property]));
      }

      const nextValue = Reflect.get(target, property, receiver);
      return createTrackingProxy(nextValue, [...path, property], visited, seenDependencies);
    },
  });

  visited.set(value, proxy);
  return proxy as T;
}

function storeTrace(trace: DependencyTrace) {
  traceStore.set(trace.traceId, trace);
  for (const listener of traceListeners) {
    listener(trace);
  }
}

export function onDependencyTrace(listener: DependencyTraceListener): () => void {
  traceListeners.add(listener);
  return () => {
    traceListeners.delete(listener);
  };
}

export function getDependencyTrace(traceId: string): DependencyTrace | undefined {
  return traceStore.get(traceId);
}

export function listDependencyTracesByPrefix(prefix: string): DependencyTrace[] {
  return [...traceStore.values()]
    .filter((trace) => trace.traceId.startsWith(prefix))
    .sort((left, right) => left.timestamp - right.timestamp);
}

export function clearDependencyTraces() {
  traceStore.clear();
}

export async function resolveWithDependencyTracking<T>(
  traceId: string,
  ctx: PluginContext,
  resolver: (trackedContext: PluginContext) => T | Promise<T>,
): Promise<T> {
  const dependencySet = new Set<string>();
  const visited = new WeakMap<object, unknown>();
  const trackedContext = createTrackingProxy<PluginContext>(
    ctx,
    ["ctx"],
    visited,
    dependencySet,
  );

  const value = await resolver(trackedContext);
  storeTrace({
    traceId,
    dependencies: [...dependencySet].sort(),
    timestamp: Date.now(),
  });
  return value;
}
