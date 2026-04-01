import { useCurrentNode } from "./use-node";
import { useNode } from "./use-node";

function pickUiProps(
  node: Record<string, unknown> | undefined,
  fieldKeys: string[],
) {
  const result: Record<string, unknown> = {};
  if (!node) {
    return result;
  }

  for (const key of fieldKeys) {
    result[key] = node[key];
  }
  return result;
}

export function useNodeUi(
  id: string,
  fieldKeys: string[] = ["renderLabel", "renderDescription"],
) {
  return pickUiProps(useNode(id)?.props, fieldKeys);
}

export function useCurrentNodeUi(
  fieldKeys: string[] = ["renderLabel", "renderDescription"],
) {
  return pickUiProps(useCurrentNode()?.props, fieldKeys);
}
