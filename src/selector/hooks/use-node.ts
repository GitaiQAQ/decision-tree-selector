import { useCurrentNodeId } from "../context/current-node";
import { useSelectorTree } from "../context/tree-provider";

export function useNode(id: string) {
  return useSelectorTree().nodes[id];
}

export function useCurrentNode() {
  return useNode(useCurrentNodeId());
}
