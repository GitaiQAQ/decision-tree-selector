import type { ComponentType, ReactNode } from "react";

export type SelectorSymbol = string;

export const SWITCHABLE_MARKS = {
  GROUP: "switchable.group",
  OPTION: "switchable.option",
  DEFAULT: "switchable.default",
} as const;

export type SwitchableMark =
  (typeof SWITCHABLE_MARKS)[keyof typeof SWITCHABLE_MARKS];

export interface NodeRenderProps {
  level: number;
  internalLevel: number;
  order: number;
}

export interface NodeWrapperRenderProps extends NodeRenderProps {
  children: ReactNode;
}

export interface NodeChildrenRenderProps extends NodeRenderProps {
  children: () => ReactNode[];
}

export interface ViewExtension {
  Before?: ComponentType<NodeRenderProps>;
  After?: ComponentType<NodeRenderProps>;
}

export interface NodeRenderCustomization {
  CustomWrapperRender?: ComponentType<NodeWrapperRenderProps>;
  CustomItemRender?: ComponentType<NodeRenderProps>;
  CustomItemRenderCompatibleViewExtension?: ViewExtension;
  CustomChildrenRender?: ComponentType<NodeChildrenRenderProps>;
  CustomChildrenRenderCompatibleViewExtension?: ViewExtension;
  CustomExtraRender?: ComponentType<NodeRenderProps>;
}

export type DynamicValue<T> =
  | T
  | Promise<T>
  | ((ctx: PluginContext) => DynamicValue<T>);
export type Predicate = (ctx: PluginContext) => boolean | Promise<boolean>;
export type DefaultOnResolver = (
  ctx: PluginContext,
) => SelectorSymbol | undefined | Promise<SelectorSymbol | undefined>;
export type Renderable = ReactNode | ComponentType;

export interface NodeInputProps {
  order?: number;
  renderLabel?: Renderable;
  renderDescription?: Renderable;
  hidden?: Predicate;
  disabled?: Predicate;
  forbidden?: Predicate;
  defaultOn?: DefaultOnResolver;
  defaultOff?: DefaultOnResolver;
  [key: string]: unknown;
}

export interface SelectorChildFactory {
  render: () => RuntimeNode;
}

export interface NodeConfig extends NodeRenderCustomization {
  id?: string;
  symbol: SelectorSymbol;
  displayAs?: SelectorSymbol;
  marks?: string[];
  plugins?: Plugin[];
  props?: NodeInputProps;
  selected?: SelectorSymbol[];
  children?: Array<NodeConfig | RuntimeNode | SelectorChildFactory>;
}

export interface RuntimeNode extends NodeRenderCustomization {
  id?: string;
  symbol: SelectorSymbol;
  displayAs?: SelectorSymbol;
  marks?: string[];
  plugins?: Plugin[];
  props: Record<string, unknown>;
  selected: SelectorSymbol[];
  children: RuntimeNode[];
  parentId?: string;
  index?: number;
  nodeCreationStack?: string;
  tagSymbol?: string;
  getParent?: () => RuntimeNode | undefined;
  getAncestors?: () => RuntimeNode[];
}

export interface RenderedNode extends NodeRenderCustomization {
  id: string;
  symbol: SelectorSymbol;
  displayAs?: SelectorSymbol;
  level: number;
  internalLevel: number;
  order: number;
  props: Record<string, unknown>;
  children: RenderedNode[];
}

export interface RuntimeSelectionState {
  value?: SelectorSymbol;
  setValue: (
    nextValue: SelectorSymbol | undefined,
    previousValue?: SelectorSymbol,
  ) => void;
}

export interface RuntimeRootState {
  selection: RuntimeSelectionState;
}

export interface PluginContext {
  node: RuntimeNode;
  root: RuntimeRootState;
  nodes: Record<string, RuntimeNode>;
  ancestors: RuntimeNode[];
  level: number;
  internalLevel: number;
  parent?: RuntimeNode;
}

export type Plugin = (ctx: PluginContext) => void;

export interface BootstrapConfig {
  modifiers?: Array<(ctx: PluginContext) => void>;
  enableDefaultOn?: boolean;
}

export interface BootstrapResult {
  root: RenderedNode;
  nodes: Record<string, RuntimeNode>;
}

export interface SelectorProviderProps {
  tree: RuntimeNode;
  value?: SelectorSymbol;
  defaultValue?: SelectorSymbol;
  onValueChange?: (
    nextValue: SelectorSymbol | undefined,
    previousValue?: SelectorSymbol,
  ) => void;
  modifiers?: Array<(ctx: PluginContext) => void>;
  autoSelectDefault?: boolean;
  children?: ReactNode;
}
