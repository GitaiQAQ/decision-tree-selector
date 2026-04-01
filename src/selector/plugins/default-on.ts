import { Meta } from "../meta";
import type { PluginContext, RuntimeNode, SelectorSymbol } from "../types";
import {
  getAncestorNodeByLevel,
  getDirectChildrenExcludingPortalMarks,
  isDirectChildSelectableInParentContext,
  isContainerNode,
  resolveValueFromMaybeDynamicFunctionOrPromise,
} from "../runtime-helpers";

export async function defaultOnFirstChild(
  ctx: PluginContext,
): Promise<SelectorSymbol | undefined> {
  for (const child of getDirectChildrenExcludingPortalMarks(ctx.node)) {
    if (
      !(await isDirectChildSelectableInParentContext(ctx, child, {
        includeForbidden: true,
      }))
    ) {
      continue;
    }

    const childContext: PluginContext = {
      ...ctx,
      node: child,
      ancestors: [...ctx.ancestors, ctx.node],
      parent: ctx.node,
    };
    const resolved = await resolveValueFromMaybeDynamicFunctionOrPromise<
      SelectorSymbol | undefined
    >(child.props[Meta.DEFAULT_ON], childContext, {
      traceId: child.id ? `${child.id}::${Meta.DEFAULT_ON}` : undefined,
    });
    if (resolved !== undefined) {
      return resolved;
    }
  }
  return undefined;
}

export function defaultOffToAncestor(level = 1) {
  return async ({ node }: PluginContext) =>
    getAncestorNodeByLevel(node, level)?.symbol;
}

export function defaultOffToAncestorDefaultOn(level = 1) {
  return async ({ node, ...rest }: PluginContext) => {
    const ancestor = getAncestorNodeByLevel(node, level);
    if (!ancestor) {
      return undefined;
    }
    return defaultOnFirstChild({
      ...rest,
      node: ancestor,
      ancestors: ancestor.getAncestors?.() ?? [],
      parent: ancestor.getParent?.(),
    });
  };
}

export const defaultOnRules = {
  modifyNode(ctx: PluginContext) {
    if (ctx.node.props[Meta.DEFAULT_ON]) {
      return;
    }

    if (isContainerNode(ctx.node)) {
      ctx.node.props[Meta.DEFAULT_ON] = () => defaultOnFirstChild(ctx);
      return;
    }

    ctx.node.props[Meta.DEFAULT_ON] = () => ctx.node.symbol;
  },
};

export function isContainerRuntimeNode(node: RuntimeNode) {
  return isContainerNode(node);
}
