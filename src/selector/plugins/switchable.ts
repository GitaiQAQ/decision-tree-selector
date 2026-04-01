import { Meta } from "../meta";
import {
  buildPluginContextForNode,
  getDirectChildrenExcludingPortalMarks,
  isDirectChildSelectableInParentContext,
  resolveValueFromMaybeDynamicFunctionOrPromise,
} from "../runtime-helpers";
import { defaultOnFirstChild } from "./default-on";
import type {
  Plugin,
  PluginContext,
  RuntimeNode,
  RuntimeRootState,
  SelectorSymbol,
} from "../types";
import { SWITCHABLE_MARKS } from "../types";

function getSwitchableOptions(groupNode: RuntimeNode): RuntimeNode[] {
  return getDirectChildrenExcludingPortalMarks(groupNode).filter((child) =>
    child.marks?.includes(SWITCHABLE_MARKS.OPTION),
  );
}

async function resolveSelectableSwitchableOptions(
  ctx: PluginContext,
  groupNode: RuntimeNode,
): Promise<RuntimeNode[]> {
  const options = getSwitchableOptions(groupNode);
  const selectable: RuntimeNode[] = [];
  for (const option of options) {
    if (
      await isDirectChildSelectableInParentContext(ctx, option, {
        visibleOnly: true,
        includeForbidden: true,
      })
    ) {
      selectable.push(option);
    }
  }
  return selectable;
}

function findActiveOptionBySelection(
  options: RuntimeNode[],
  selectedValue: SelectorSymbol | undefined,
): RuntimeNode | undefined {
  if (selectedValue === undefined) {
    return undefined;
  }
  return options.find((option) => option.selected.includes(selectedValue));
}

async function resolveOptionValue(
  ctx: PluginContext,
  option: RuntimeNode,
): Promise<SelectorSymbol | undefined> {
  const optionContext: PluginContext = {
    ...ctx,
    node: option,
    ancestors: [...ctx.ancestors, ctx.node],
    parent: ctx.node,
  };
  const fromDefaultOn = await resolveValueFromMaybeDynamicFunctionOrPromise<
    SelectorSymbol | undefined
  >(option.props[Meta.DEFAULT_ON], optionContext, {
    traceId: option.id ? `${option.id}::${Meta.DEFAULT_ON}` : undefined,
  });
  return fromDefaultOn ?? option.symbol;
}

async function resolveFallbackByDefaultOnMechanism(
  ctx: PluginContext,
): Promise<SelectorSymbol | undefined> {
  const directChildren = getDirectChildrenExcludingPortalMarks(ctx.node);
  for (const child of directChildren) {
    if (
      !(await isDirectChildSelectableInParentContext(ctx, child, {
        visibleOnly: true,
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
    return child.symbol;
  }

  return defaultOnFirstChild(ctx);
}

async function resolveDefaultSwitchableTarget(
  ctx: PluginContext,
  selectableOptions: RuntimeNode[],
): Promise<SelectorSymbol | undefined> {
  const defaultMarked = selectableOptions.find((option) =>
    option.marks?.includes(SWITCHABLE_MARKS.DEFAULT),
  );
  if (defaultMarked) {
    return resolveOptionValue(ctx, defaultMarked);
  }

  const firstSelectable = selectableOptions[0];
  if (firstSelectable) {
    return resolveOptionValue(ctx, firstSelectable);
  }

  return resolveFallbackByDefaultOnMechanism(ctx);
}

export async function resolveSwitchableTarget(
  ctx: PluginContext,
  options: {
    targetSymbol?: SelectorSymbol;
    preferNextFromCurrentSelection?: boolean;
  } = {},
): Promise<SelectorSymbol | undefined> {
  const selectableOptions = await resolveSelectableSwitchableOptions(ctx, ctx.node);

  if (options.targetSymbol !== undefined) {
    const matched = selectableOptions.find(
      (option) => option.symbol === options.targetSymbol,
    );
    if (matched) {
      return resolveOptionValue(ctx, matched);
    }
    return resolveDefaultSwitchableTarget(ctx, selectableOptions);
  }

  if (options.preferNextFromCurrentSelection) {
    const active = findActiveOptionBySelection(
      selectableOptions,
      ctx.root.selection.value,
    );
    if (active) {
      const activeIndex = selectableOptions.findIndex(
        (option) => option.id === active.id,
      );
      if (activeIndex >= 0 && selectableOptions.length > 1) {
        const nextOption =
          selectableOptions[(activeIndex + 1) % selectableOptions.length];
        return resolveOptionValue(ctx, nextOption);
      }
    }
  }

  return resolveDefaultSwitchableTarget(ctx, selectableOptions);
}

export function findNearestSwitchableAncestor(
  node: RuntimeNode | undefined,
): RuntimeNode | undefined {
  let current = node;
  while (current) {
    if (current.marks?.includes(SWITCHABLE_MARKS.GROUP)) {
      return current;
    }
    current = current.getParent?.();
  }
  return undefined;
}

export async function switchAtNearestSwitchableAncestor(options: {
  nodeId: string;
  nodes: Record<string, RuntimeNode>;
  root: RuntimeRootState;
  targetSymbol?: SelectorSymbol;
  setValue: (
    nextValue: SelectorSymbol | undefined,
    previousValue?: SelectorSymbol,
  ) => void;
  previousValue?: SelectorSymbol;
}): Promise<SelectorSymbol | undefined> {
  const sourceNode = options.nodes[options.nodeId];
  if (!sourceNode) {
    return undefined;
  }

  const groupNode = findNearestSwitchableAncestor(sourceNode);
  if (!groupNode) {
    return undefined;
  }

  const groupContext = buildPluginContextForNode(groupNode, options.nodes, options.root);
  const nextValue = await resolveSwitchableTarget(groupContext, {
    targetSymbol: options.targetSymbol,
    preferNextFromCurrentSelection: options.targetSymbol === undefined,
  });

  if (nextValue !== undefined) {
    options.setValue(nextValue, options.previousValue);
  }

  return nextValue;
}

export const switchable: Plugin = (ctx) => {
  if (!ctx.node.marks?.includes(SWITCHABLE_MARKS.GROUP)) {
    return;
  }
  if (ctx.node.props[Meta.DEFAULT_ON]) {
    return;
  }

  ctx.node.props[Meta.DEFAULT_ON] = () => resolveSwitchableTarget(ctx);
};
