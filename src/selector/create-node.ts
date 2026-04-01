import {
  DEFAULT_ON_NODE_MARK,
  DSL_HELPER_SOURCE_MARK_PREFIX,
  Meta,
  VirtualNodeType,
} from "./meta";
import type {
  NodeConfig,
  NodeInputProps,
  RuntimeNode,
  SelectorChildFactory,
  SelectorSymbol,
} from "./types";

function assertNoDeprecatedProps(props: NodeInputProps) {
  if ("label" in props || "desc" in props) {
    throw new Error(
      "Use 'renderLabel' and 'renderDescription' instead of 'label' or 'desc'.",
    );
  }
}

function createHelperSourceMark(source: string) {
  return `${DSL_HELPER_SOURCE_MARK_PREFIX}${source}`;
}

export function appendHelperSourceMark(
  marks: string[] | undefined,
  source: string,
): string[] {
  return [...new Set([...(marks ?? []), createHelperSourceMark(source)])];
}

function getNodeCreationStack(): string | undefined {
  const stack = new Error().stack;
  if (!stack) {
    return undefined;
  }
  return stack.split("\n").slice(2).join("\n");
}

function isSelectorChildFactory(
  child: NodeConfig | RuntimeNode | SelectorChildFactory,
): child is SelectorChildFactory {
  return "render" in child;
}

function isRuntimeNode(child: NodeConfig | RuntimeNode): child is RuntimeNode {
  return (
    "selected" in child && Array.isArray(child.selected) && "props" in child
  );
}

function resolveChildren(
  children: NonNullable<NodeConfig["children"]>,
): RuntimeNode[] {
  return children.map((child) => {
    if (isSelectorChildFactory(child)) {
      return child.render();
    }
    if (isRuntimeNode(child)) {
      return child;
    }

    const {
      symbol,
      children: nestedChildren = [],
      props: nestedProps = {},
      ...restConfig
    } = child;
    return createNode(
      symbol,
      { ...restConfig, ...nestedProps },
      nestedChildren,
    );
  });
}

function normalizeReactiveProps(
  props: NodeInputProps,
): Record<string, unknown> {
  const { hidden, disabled, forbidden, defaultOn, defaultOff, ...restProps } =
    props;

  return {
    ...restProps,
    [Meta.HIDDEN]: hidden ? [hidden] : [],
    [Meta.DISABLED]: disabled ? [disabled] : [],
    [Meta.FORBIDDEN]: forbidden ? [forbidden] : [],
    [Meta.DEFAULT_ON]: defaultOn,
    [Meta.DEFAULT_OFF]: defaultOff,
  };
}

function collectSelected(
  symbol: SelectorSymbol,
  selected: SelectorSymbol[] | undefined,
  children: RuntimeNode[],
) {
  const nestedSelections = children.flatMap((child) => child.selected);
  const values = new Set([...nestedSelections, ...(selected ?? [])]);
  if (
    symbol !== VirtualNodeType.Fragment &&
    symbol !== VirtualNodeType.Virtual
  ) {
    values.add(symbol);
  }
  return [...values];
}

export function createNode(
  symbol: SelectorSymbol,
  config: Omit<NodeConfig, "symbol" | "children"> &
    Partial<NodeInputProps> = {},
  children: NonNullable<NodeConfig["children"]> = [],
): RuntimeNode {
  const {
    id,
    marks,
    plugins,
    displayAs,
    selected,
    CustomWrapperRender,
    CustomItemRender,
    CustomItemRenderCompatibleViewExtension,
    CustomChildrenRender,
    CustomChildrenRenderCompatibleViewExtension,
    CustomExtraRender,
    ...props
  } = config;

  assertNoDeprecatedProps(props);
  const resolvedChildren = resolveChildren(children);
  const runtimeNode: RuntimeNode = {
    id,
    symbol,
    displayAs,
    marks,
    plugins,
    props: normalizeReactiveProps(props),
    selected: collectSelected(symbol, selected, resolvedChildren),
    children: resolvedChildren,
    CustomWrapperRender,
    CustomItemRender,
    CustomItemRenderCompatibleViewExtension,
    CustomChildrenRender,
    CustomChildrenRenderCompatibleViewExtension,
    CustomExtraRender,
  };

  const nodeCreationStack = getNodeCreationStack();
  if (nodeCreationStack) {
    runtimeNode.nodeCreationStack = nodeCreationStack;
  }

  return runtimeNode;
}

export function createDefaultPolicyNode(
  symbol: SelectorSymbol,
  config: Omit<NodeConfig, "symbol" | "children"> &
    Partial<NodeInputProps> = {},
  children: NonNullable<NodeConfig["children"]> = [],
) {
  return createNode(
    symbol,
    {
      ...config,
      hidden: () => true,
      marks: [
        ...new Set([
          ...(config.marks ?? []),
          DEFAULT_ON_NODE_MARK,
          createHelperSourceMark("dsl.defaultPolicy"),
        ]),
      ],
    },
    children,
  );
}
