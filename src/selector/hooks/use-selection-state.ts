import { useSelectable } from "../context/selectable";
import { useCurrentNode } from "./use-node";
import { useNode } from "./use-node";

export function useSelectionState(id: string) {
  const node = useNode(id);
  const { value } = useSelectable();
  if (!node || value === undefined) {
    return false;
  }
  return node.selected.includes(value);
}

export function useCurrentSelectionState() {
  const node = useCurrentNode();
  const { value } = useSelectable();
  if (!node || value === undefined) {
    return false;
  }
  return node.selected.includes(value);
}
