import { Meta, VirtualNodeType } from "./meta";
import { defaultOnRules } from "./plugins/default-on";
import type {
  BootstrapConfig,
  BootstrapResult,
  PluginContext,
  RenderedNode,
  RuntimeNode,
  RuntimeRootState,
} from "./types";

function convertToLayeredNode(ctx: PluginContext) {
  const { node, ancestors, parent } = ctx;
  node.props[Meta.HIDDEN] = node.props[Meta.HIDDEN] ?? [];
  node.props[Meta.DISABLED] = node.props[Meta.DISABLED] ?? [];
  node.props[Meta.FORBIDDEN] = node.props[Meta.FORBIDDEN] ?? [];

  node.getAncestors = () => [...ancestors];
  node.getParent = () => parent;
  node.parentId = parent?.id;
  node.index = parent ? parent.children.indexOf(node) : 0;
  node.id = node.id ?? (parent ? `${parent.id}.c${node.index}` : "r");

  const selectedKeys = new Set<string>();
  for (const ancestor of [...ancestors, node]) {
    for (const value of ancestor.selected) {
      selectedKeys.add(value);
    }
  }
  node.props[Meta.SELECTED_KEYS] = [...selectedKeys];
}

function isVirtualNode(node: RuntimeNode) {
  return (
    node.symbol === VirtualNodeType.Fragment ||
    node.symbol === VirtualNodeType.Virtual
  );
}

function walk(
  node: RuntimeNode,
  nodes: Record<string, RuntimeNode>,
  rootState: RuntimeRootState,
  config: BootstrapConfig,
  ancestors: RuntimeNode[] = [],
  parent?: RuntimeNode,
  level = 0,
  internalLevel = 0,
): RenderedNode {
  const ctx: PluginContext = {
    node,
    root: rootState,
    nodes,
    ancestors,
    parent,
    level,
    internalLevel,
  };

  convertToLayeredNode(ctx);
  node.plugins?.forEach((plugin) => plugin(ctx));
  config.modifiers?.forEach((modifier) => modifier(ctx));
  if (config.enableDefaultOn !== false) {
    defaultOnRules.modifyNode(ctx);
  }

  nodes[node.id ?? "r"] = node;

  const nextLevel = isVirtualNode(node) ? level : level + 1;
  const children = node.children.map((child) =>
    walk(
      child,
      nodes,
      rootState,
      config,
      [...ancestors, node],
      node,
      nextLevel,
      internalLevel + 1,
    ),
  );

  return {
    id: node.id ?? "r",
    symbol: node.symbol,
    displayAs: node.displayAs,
    level,
    internalLevel,
    order: typeof node.props.order === "number" ? node.props.order : 0,
    props: node.props,
    children,
    CustomWrapperRender: node.CustomWrapperRender,
    CustomItemRender: node.CustomItemRender,
    CustomItemRenderCompatibleViewExtension:
      node.CustomItemRenderCompatibleViewExtension,
    CustomChildrenRender: node.CustomChildrenRender,
    CustomChildrenRenderCompatibleViewExtension:
      node.CustomChildrenRenderCompatibleViewExtension,
    CustomExtraRender: node.CustomExtraRender,
  };
}

export function bootstrapFromDsl(
  tree: RuntimeNode,
  config: BootstrapConfig = {},
  rootState: RuntimeRootState,
): BootstrapResult {
  const nodes: Record<string, RuntimeNode> = {};
  const root = walk(tree, nodes, rootState, config, [], undefined, 0, 0);
  return { root, nodes };
}
