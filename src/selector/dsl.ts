import { childVisibilityMutex } from "./plugins/child-visibility-mutex";
import { switchable } from "./plugins/switchable";
import { Meta, VirtualNodeType } from "./meta";
import {
  appendHelperSourceMark,
  createDefaultPolicyNode,
  createNode,
} from "./create-node";
import {
  SWITCHABLE_MARKS,
  type DefaultOnResolver,
  type NodeConfig,
  type NodeInputProps,
  type Plugin,
  type PluginContext,
  type RuntimeNode,
  type SelectorSymbol,
} from "./types";
import {
  getDirectChildrenExcludingPortalMarks,
  isDirectChildSelectableInParentContext,
  resolveValueFromMaybeDynamicFunctionOrPromise,
} from "./runtime-helpers";

function isCurrentSelectionUnderParent(ctx: PluginContext): boolean {
  const selectedValue = ctx.root.selection.value;
  if (selectedValue === undefined) {
    return false;
  }
  return Boolean(ctx.node.getParent?.()?.selected.includes(selectedValue));
}

function appendUniquePlugin(
  config: Pick<NodeConfig, "plugins">,
  plugin: Plugin,
) {
  return config.plugins?.includes(plugin)
    ? config.plugins
    : [...(config.plugins ?? []), plugin];
}

function withPanelHidden(
  config: Omit<NodeConfig, "symbol" | "children"> & Record<string, unknown>,
) {
  const existingHidden = config.hidden as
    | ((ctx: PluginContext) => boolean | Promise<boolean>)
    | undefined;
  return {
    ...config,
    hidden: async (ctx: PluginContext) => {
      if (!isCurrentSelectionUnderParent(ctx)) {
        return true;
      }
      return existingHidden ? await existingHidden(ctx) : false;
    },
  };
}

function appendUniqueMark(marks: string[] | undefined, mark: string) {
  return [...new Set([...(marks ?? []), mark])];
}

function withMutexPlugin(config: Omit<NodeConfig, "symbol" | "children">) {
  return {
    ...config,
    plugins: appendUniquePlugin(config, childVisibilityMutex),
  };
}

function withSwitchablePlugin(config: Omit<NodeConfig, "symbol" | "children">) {
  return {
    ...config,
    plugins: appendUniquePlugin(config, switchable),
    marks: appendUniqueMark(config.marks, SWITCHABLE_MARKS.GROUP),
  };
}

async function pickFirstSelectableChildDefaultOnByCandidateSymbols(
  ctx: PluginContext,
  candidates: SelectorSymbol[],
): Promise<SelectorSymbol | undefined> {
  for (const candidate of candidates) {
    const child = getDirectChildrenExcludingPortalMarks(ctx.node).find(
      (item) => item.symbol === candidate,
    );
    if (!child) {
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
    const selectedValue = await resolveValueFromMaybeDynamicFunctionOrPromise<
      SelectorSymbol | undefined
    >(child.props[Meta.DEFAULT_ON], childContext, {
      traceId: child.id ? `${child.id}::${Meta.DEFAULT_ON}` : undefined,
    });
    if (selectedValue !== undefined) {
      return selectedValue;
    }
  }
  return undefined;
}

function resolveValueByDefaultOnInterface(
  ctx: PluginContext,
  value: SelectorSymbol,
): Promise<SelectorSymbol | undefined> {
  return pickFirstSelectableChildDefaultOnByCandidateSymbols(ctx, [value]).then(
    (resolvedValue) => resolvedValue ?? value,
  );
}

function resolveFallbackValue(
  ctx: PluginContext,
  fallback: SelectorSymbol | DefaultOnResolver | undefined,
): Promise<SelectorSymbol | undefined> {
  if (typeof fallback === "function") {
    return Promise.resolve(fallback(ctx));
  }
  return Promise.resolve(fallback);
}

type CreateNodeConfig = Omit<NodeConfig, "symbol" | "children" | "props"> &
  Partial<NodeInputProps>;

export function group(
  config: CreateNodeConfig = {},
  children: NonNullable<NodeConfig["children"]> = [],
): RuntimeNode {
  return createNode(
    VirtualNodeType.Fragment,
    { ...config, marks: appendHelperSourceMark(config.marks, "dsl.group") },
    children,
  );
}

export function mutexGroup(
  config: CreateNodeConfig = {},
  children: NonNullable<NodeConfig["children"]> = [],
): RuntimeNode {
  return createNode(
    VirtualNodeType.Fragment,
    {
      ...withMutexPlugin(config),
      marks: appendHelperSourceMark(config.marks, "dsl.mutexGroup"),
    },
    children,
  );
}

export function displayNode(
  displayAs: SelectorSymbol,
  config: CreateNodeConfig = {},
  children: NonNullable<NodeConfig["children"]> = [],
): RuntimeNode {
  return createNode(
    VirtualNodeType.Virtual,
    {
      ...config,
      displayAs,
      marks: appendHelperSourceMark(config.marks, "dsl.displayNode"),
    },
    children,
  );
}

export function virtualNode(
  config: CreateNodeConfig = {},
  children: NonNullable<NodeConfig["children"]> = [],
): RuntimeNode {
  return createNode(
    VirtualNodeType.Virtual,
    {
      ...config,
      marks: appendHelperSourceMark(config.marks, "dsl.virtualNode"),
    },
    children,
  );
}

export function optionPanel(
  symbol: SelectorSymbol,
  config: CreateNodeConfig = {},
  children: NonNullable<NodeConfig["children"]> = [],
): RuntimeNode {
  return createNode(
    symbol,
    {
      ...withPanelHidden(config),
      marks: appendHelperSourceMark(config.marks, "dsl.optionPanel"),
    },
    children,
  );
}

export function optionMutex(
  symbol: SelectorSymbol,
  config: CreateNodeConfig = {},
  children: NonNullable<NodeConfig["children"]> = [],
): RuntimeNode {
  return createNode(
    symbol,
    {
      ...withMutexPlugin(config),
      marks: appendHelperSourceMark(config.marks, "dsl.optionMutex"),
    },
    children,
  );
}

interface SwitchableOptionConfig extends CreateNodeConfig {
  default?: boolean;
}

export function switchableGroup(
  config: CreateNodeConfig = {},
  children: NonNullable<NodeConfig["children"]> = [],
): RuntimeNode {
  const nextConfig = withSwitchablePlugin(config);
  return createNode(
    VirtualNodeType.Fragment,
    {
      ...nextConfig,
      marks: appendHelperSourceMark(nextConfig.marks, "dsl.switchableGroup"),
    },
    children,
  );
}

export function switchableOption(
  symbol: SelectorSymbol,
  config: SwitchableOptionConfig = {},
  children: NonNullable<NodeConfig["children"]> = [],
): RuntimeNode {
  const { default: isDefault, ...restConfig } = config;
  let marks = appendUniqueMark(restConfig.marks, SWITCHABLE_MARKS.OPTION);
  if (isDefault) {
    marks = appendUniqueMark(marks, SWITCHABLE_MARKS.DEFAULT);
  }
  return createNode(
    symbol,
    {
      ...restConfig,
      marks: appendHelperSourceMark(marks, "dsl.switchableOption"),
    },
    children,
  );
}

export function defaultPolicy(
  symbol: SelectorSymbol,
  config: CreateNodeConfig = {},
  children: NonNullable<NodeConfig["children"]> = [],
): RuntimeNode {
  return createDefaultPolicyNode(symbol, config, children);
}

export function predicateDefaultOn(
  predicate: (ctx: PluginContext) => boolean | Promise<boolean>,
  enabledValue: SelectorSymbol,
  disabledValue?: SelectorSymbol,
): DefaultOnResolver {
  return async (ctx) => {
    const nextValue = (await predicate(ctx)) ? enabledValue : disabledValue;
    return nextValue === undefined
      ? undefined
      : resolveValueByDefaultOnInterface(ctx, nextValue);
  };
}

export function marksWhenDefaultOn(
  predicate: (ctx: PluginContext) => boolean | Promise<boolean>,
  preferredMarks: string[],
  fallback?: SelectorSymbol | DefaultOnResolver,
): DefaultOnResolver {
  return async (ctx) => {
    if (!(await predicate(ctx))) {
      return resolveFallbackValue(ctx, fallback);
    }

    for (const mark of preferredMarks) {
      const child = getDirectChildrenExcludingPortalMarks(ctx.node).find(
        (item) => item.marks?.includes(mark),
      );
      if (!child) {
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
      const selectedValue = await resolveValueFromMaybeDynamicFunctionOrPromise<
        SelectorSymbol | undefined
      >(child.props[Meta.DEFAULT_ON], childContext, {
        traceId: child.id ? `${child.id}::${Meta.DEFAULT_ON}` : undefined,
      });
      if (selectedValue !== undefined) {
        return selectedValue;
      }
    }

    return resolveFallbackValue(ctx, fallback);
  };
}

export const dsl = {
  node: createNode,
  group,
  mutexGroup,
  displayNode,
  virtualNode,
  optionPanel,
  optionMutex,
  switchableGroup,
  switchableOption,
  defaultPolicy,
  predicateDefaultOn,
  marksWhenDefaultOn,
} as const;
