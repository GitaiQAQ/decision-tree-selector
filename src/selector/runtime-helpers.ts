import { Meta } from "./meta";
import { resolveWithDependencyTracking } from "./tracking/dependency-tracker";
import type {
  DefaultOnResolver,
  DynamicValue,
  PluginContext,
  RuntimeNode,
  RuntimeRootState,
  SelectorSymbol,
} from "./types";

export async function resolveValueFromMaybeDynamicFunctionOrPromise<
  T = unknown,
>(
  value: DynamicValue<T> | unknown,
  ctx: PluginContext,
  options: { traceId?: string } = {},
): Promise<T> {
  if (typeof value === "function") {
    const resolveNext = async (trackedContext: PluginContext) =>
      resolveValueFromMaybeDynamicFunctionOrPromise<T>(
        (value as (ctx: PluginContext) => DynamicValue<T>)(trackedContext),
        trackedContext,
        options,
      );

    if (options.traceId) {
      return resolveWithDependencyTracking<T>(options.traceId, ctx, resolveNext);
    }

    return resolveValueFromMaybeDynamicFunctionOrPromise(
      (value as (ctx: PluginContext) => DynamicValue<T>)(ctx),
      ctx,
      options,
    );
  }
  if (
    value &&
    typeof value === "object" &&
    "then" in value &&
    typeof (value as Promise<unknown>).then === "function"
  ) {
    return value as Promise<T>;
  }
  return value as T;
}

export function getDirectChildrenExcludingPortalMarks(
  node: RuntimeNode,
): RuntimeNode[] {
  return (node.children ?? []).filter(
    (child) => !child.marks?.includes("portal"),
  );
}

export function getAncestorNodeByLevel(
  node: RuntimeNode,
  level: number,
): RuntimeNode | undefined {
  let current: RuntimeNode | undefined = node;
  for (let index = 0; index < level; index += 1) {
    current = current?.getParent?.();
  }
  return current;
}

export function isContainerNode(node: RuntimeNode): boolean {
  return node.children.length > 0;
}

export function buildPluginContextForNode(
  node: RuntimeNode,
  nodes: Record<string, RuntimeNode>,
  root: RuntimeRootState,
): PluginContext {
  const ancestors = node.getAncestors?.() ?? [];
  return {
    node,
    root,
    nodes,
    ancestors,
    parent: node.getParent?.(),
    level: Math.max(0, ancestors.length - 1),
    internalLevel: ancestors.length,
  };
}

export async function doesAnyPredicateReturnTrue(
  metaFns: unknown,
  ctx: PluginContext,
  options: { traceScope?: string } = {},
): Promise<boolean> {
  if (!Array.isArray(metaFns) || metaFns.length === 0) {
    return false;
  }

  for (const [index, predicate] of metaFns.entries()) {
    if (typeof predicate !== "function") {
      continue;
    }

    const result = await resolveValueFromMaybeDynamicFunctionOrPromise<boolean>(
      predicate as DynamicValue<boolean>,
      ctx,
      {
        traceId: ctx.node.id
          ? `${ctx.node.id}::${options.traceScope ?? "predicate"}[${index}]`
          : undefined,
      },
    );
    if (result === true) {
      return true;
    }
  }

  return false;
}

export async function isDirectChildSelectableInParentContext(
  ctx: PluginContext,
  child: RuntimeNode,
  options: { visibleOnly?: boolean; includeForbidden?: boolean } = {},
): Promise<boolean> {
  const childContext = {
    ...ctx,
    node: child,
    ancestors: [...ctx.ancestors, ctx.node],
    parent: ctx.node,
  };
  const isDisabled = await doesAnyPredicateReturnTrue(
    child.props[Meta.DISABLED],
    childContext,
    { traceScope: Meta.DISABLED },
  );
  if (isDisabled) {
    return false;
  }

  if (options.includeForbidden) {
    const isForbidden = await doesAnyPredicateReturnTrue(
      child.props[Meta.FORBIDDEN],
      childContext,
      { traceScope: Meta.FORBIDDEN },
    );
    if (isForbidden) {
      return false;
    }
  }

  if (options.visibleOnly) {
    const isHidden = await doesAnyPredicateReturnTrue(
      child.props[Meta.HIDDEN],
      childContext,
      { traceScope: Meta.HIDDEN },
    );
    if (isHidden) {
      return false;
    }
  }

  return true;
}

export async function countVisibleSelectableDirectChildrenExcludingPortalInNode(
  ctx: PluginContext,
): Promise<number> {
  let count = 0;
  for (const child of getDirectChildrenExcludingPortalMarks(ctx.node)) {
    if (
      await isDirectChildSelectableInParentContext(ctx, child, {
        visibleOnly: true,
        includeForbidden: true,
      })
    ) {
      count += 1;
    }
  }
  return count;
}

export async function countEnabledSelectableLeavesInSubtreeExcludingPortalInNode(
  ctx: PluginContext,
): Promise<number> {
  if (!isContainerNode(ctx.node)) {
    const disabled = await doesAnyPredicateReturnTrue(
      ctx.node.props[Meta.DISABLED],
      ctx,
      { traceScope: Meta.DISABLED },
    );
    const hidden = await doesAnyPredicateReturnTrue(
      ctx.node.props[Meta.HIDDEN],
      ctx,
      { traceScope: Meta.HIDDEN },
    );
    const forbidden = await doesAnyPredicateReturnTrue(
      ctx.node.props[Meta.FORBIDDEN],
      ctx,
      { traceScope: Meta.FORBIDDEN },
    );
    return disabled || hidden || forbidden ? 0 : 1;
  }

  let count = 0;
  for (const child of getDirectChildrenExcludingPortalMarks(ctx.node)) {
    count += await countEnabledSelectableLeavesInSubtreeExcludingPortalInNode({
      ...ctx,
      node: child,
      ancestors: [...ctx.ancestors, ctx.node],
      parent: ctx.node,
    });
  }
  return count;
}

export async function pickFirstSelectableChildDefaultOnByPreferredMarks(
  ctx: PluginContext,
  preferredMarks: string[],
): Promise<SelectorSymbol | undefined> {
  for (const mark of preferredMarks) {
    for (const child of getDirectChildrenExcludingPortalMarks(ctx.node)) {
      if (!child.marks?.includes(mark)) {
        continue;
      }

      if (
        !(await isDirectChildSelectableInParentContext(ctx, child, {
          includeForbidden: true,
        }))
      ) {
        continue;
      }

      const childContext = {
        ...ctx,
        node: child,
        ancestors: [...ctx.ancestors, ctx.node],
        parent: ctx.node,
      };
      const selected = await resolveValueFromMaybeDynamicFunctionOrPromise<
        SelectorSymbol | undefined
      >(
        child.props[Meta.DEFAULT_ON] as DefaultOnResolver | undefined,
        childContext,
        {
          traceId: child.id ? `${child.id}::${Meta.DEFAULT_ON}` : undefined,
        },
      );
      if (selected !== undefined) {
        return selected;
      }
    }
  }

  return undefined;
}
