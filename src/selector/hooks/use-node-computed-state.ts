import { useEffect, useState } from "react";

import { Meta } from "../meta";
import { useSelectable } from "../context/selectable";
import { useSelectorTree } from "../context/tree-provider";
import {
  buildPluginContextForNode,
  doesAnyPredicateReturnTrue,
} from "../runtime-helpers";
import { useCurrentNode } from "./use-node";
import { useNode } from "./use-node";

function useResolvedBoolean(id: string, key: string) {
  const node = useNode(id);
  const { nodes, runtimeRoot } = useSelectorTree();
  const { value } = useSelectable();
  const [resolvedValue, setResolvedValue] = useState<boolean | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!node) {
      setResolvedValue(undefined);
      return;
    }

    let cancelled = false;
    const context = buildPluginContextForNode(node, nodes, runtimeRoot);
    void doesAnyPredicateReturnTrue(node.props[key], context, {
      traceScope: key,
    }).then(
      (nextValue) => {
        if (!cancelled) {
          setResolvedValue(nextValue);
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [id, key, node, nodes, runtimeRoot, value]);

  return resolvedValue;
}

export function useNodeComputedState(id: string) {
  return {
    disabled: useResolvedBoolean(id, Meta.DISABLED),
    hidden: useResolvedBoolean(id, Meta.HIDDEN),
    forbidden: useResolvedBoolean(id, Meta.FORBIDDEN),
  };
}

export function useCurrentNodeComputedState() {
  const node = useCurrentNode();
  return useNodeComputedState(node?.id ?? "");
}
