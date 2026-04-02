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

type NodeComputedState = {
  disabled: boolean | undefined;
  hidden: boolean | undefined;
  forbidden: boolean | undefined;
};

const EMPTY_COMPUTED_STATE: NodeComputedState = {
  disabled: undefined,
  hidden: undefined,
  forbidden: undefined,
};

function areStatesEqual(a: NodeComputedState, b: NodeComputedState): boolean {
  return (
    a.disabled === b.disabled &&
    a.hidden === b.hidden &&
    a.forbidden === b.forbidden
  );
}

function useResolvedComputedState(id: string): NodeComputedState {
  const node = useNode(id);
  const { nodes, runtimeRoot } = useSelectorTree();
  const { value } = useSelectable();
  const [computedState, setComputedState] =
    useState<NodeComputedState>(EMPTY_COMPUTED_STATE);

  useEffect(() => {
    if (!node) {
      setComputedState((previous) =>
        areStatesEqual(previous, EMPTY_COMPUTED_STATE)
          ? previous
          : EMPTY_COMPUTED_STATE,
      );
      return;
    }

    let cancelled = false;
    const context = buildPluginContextForNode(node, nodes, runtimeRoot);
    void Promise.all([
      doesAnyPredicateReturnTrue(node.props[Meta.DISABLED], context, {
        traceScope: Meta.DISABLED,
      }),
      doesAnyPredicateReturnTrue(node.props[Meta.HIDDEN], context, {
        traceScope: Meta.HIDDEN,
      }),
      doesAnyPredicateReturnTrue(node.props[Meta.FORBIDDEN], context, {
        traceScope: Meta.FORBIDDEN,
      }),
    ]).then(([disabled, hidden, forbidden]) => {
      if (cancelled) {
        return;
      }

      const nextState: NodeComputedState = {
        disabled,
        hidden,
        forbidden,
      };

      setComputedState((previous) =>
        areStatesEqual(previous, nextState) ? previous : nextState,
      );
    });

    return () => {
      cancelled = true;
    };
  }, [id, node, nodes, runtimeRoot, value]);

  return computedState;
}

export function useNodeComputedState(id: string) {
  const computedState = useResolvedComputedState(id);

  return {
    disabled: computedState.disabled,
    hidden: computedState.hidden,
    forbidden: computedState.forbidden,
  };
}

export function useCurrentNodeComputedState() {
  const node = useCurrentNode();
  return useNodeComputedState(node?.id ?? "");
}
