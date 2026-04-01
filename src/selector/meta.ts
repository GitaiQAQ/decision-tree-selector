export enum VirtualNodeType {
  Fragment = "fragment",
  Virtual = "virtual",
}

export const Meta = {
  ID: "id",
  PARENT_ID: "parentId",
  INDEX: "index",
  SELECTED_KEYS: "selectedKeys",
  HIDDEN: "hidden$",
  DISABLED: "disabled$",
  DEFAULT_ON: "defaultOn$",
  DEFAULT_OFF: "defaultOff$",
  FORBIDDEN: "forbidden$",
  TAG_SYMBOL: "tagSymbol",
  NODE_CREATION_STACK: "nodeCreationStack",
  NODES: "nodes",
} as const;

export const DEFAULT_ON_NODE_MARK = "default-on-node";
export const DSL_HELPER_SOURCE_MARK_PREFIX = "/dsl/helper/";

export const SELECTOR_CLASS_NAMES = {
  disabled: "is-disabled",
  hidden: "is-hidden",
  selected: "is-selected",
  treeNode: "tree-node",
  treeGroup: "tree-group",
  treeWrapper: "tree-wrapper",
  treeButton: "tree-node-button",
  treeLabel: "tree-label",
  treeDescription: "tree-description",
} as const;
