import { VirtualNodeType, type RuntimeNode } from "../index";
import { TreeNodeWrapper } from "./components/TreeNodeVisual";

export function applyTreeVisuals<T extends RuntimeNode>(node: T): T {
  const shouldKeepWrapper =
    node.symbol === VirtualNodeType.Fragment ||
    node.symbol === VirtualNodeType.Virtual;

  return {
    ...node,
    CustomWrapperRender: shouldKeepWrapper
      ? node.CustomWrapperRender
      : (node.CustomWrapperRender ?? TreeNodeWrapper),
    children: node.children.map((child) => applyTreeVisuals(child)),
  } as T;
}

export function applyTreeVisualsList<T extends RuntimeNode>(nodes: T[]): T[] {
  return nodes.map((node) => applyTreeVisuals(node));
}
