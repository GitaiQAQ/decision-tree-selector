import { useCallback } from "react";

import { Meta } from "../meta";
import { useSelectable } from "../context/selectable";
import { useSelectorTree } from "../context/tree-provider";
import {
  buildPluginContextForNode,
  doesAnyPredicateReturnTrue,
  resolveValueFromMaybeDynamicFunctionOrPromise,
} from "../runtime-helpers";
import { useCurrentNode } from "./use-node";
import { useNode } from "./use-node";

export interface InteractionHandlers {
  onOptionClick: () => void;
  onOptionClear: () => void;
  onOptionToggle: () => void;
}

export function useInteractionHandlers(id: string): InteractionHandlers {
  const node = useNode(id);
  const { nodes, runtimeRoot } = useSelectorTree();
  const { value, setValue } = useSelectable();

  const resolveNodeValue = useCallback(
    async (key: string) => {
      if (!node) {
        return undefined;
      }
      const context = buildPluginContextForNode(node, nodes, runtimeRoot);
      const nextValue = await resolveValueFromMaybeDynamicFunctionOrPromise<
        string | undefined
      >(node.props[key], context, {
        traceId: node.id ? `${node.id}::${key}` : undefined,
      });
      return nextValue ?? node.symbol;
    },
    [node, nodes, runtimeRoot],
  );

  const onOptionClick = useCallback(() => {
    if (!node) {
      return;
    }

    void (async () => {
      const context = buildPluginContextForNode(node, nodes, runtimeRoot);
      const disabled = await doesAnyPredicateReturnTrue(
        node.props[Meta.DISABLED],
        context,
        { traceScope: Meta.DISABLED },
      );
      const hidden = await doesAnyPredicateReturnTrue(
        node.props[Meta.HIDDEN],
        context,
        { traceScope: Meta.HIDDEN },
      );
      const forbidden = await doesAnyPredicateReturnTrue(
        node.props[Meta.FORBIDDEN],
        context,
        { traceScope: Meta.FORBIDDEN },
      );
      if (disabled || hidden || forbidden) {
        return;
      }

      const nextValue = await resolveNodeValue(Meta.DEFAULT_ON);
      if (nextValue !== undefined) {
        setValue(nextValue, value);
      }
    })();
  }, [node, nodes, resolveNodeValue, runtimeRoot, setValue, value]);

  const onOptionClear = useCallback(() => {
    setValue(undefined, value);
  }, [setValue, value]);

  const onOptionToggle = useCallback(() => {
    if (!node) {
      return;
    }

    void (async () => {
      const isSelected = node.selected.includes(value ?? "");
      const nextValue = isSelected
        ? await resolveNodeValue(Meta.DEFAULT_OFF)
        : await resolveNodeValue(Meta.DEFAULT_ON);
      setValue(nextValue, value);
    })();
  }, [node, resolveNodeValue, setValue, value]);

  return {
    onOptionClick,
    onOptionClear,
    onOptionToggle,
  };
}

export function useCurrentInteractionHandlers() {
  const node = useCurrentNode();
  return useInteractionHandlers(node?.id ?? "");
}
