import { useCurrentNodeId } from "../context/current-node";
import { useSelectable } from "../context/selectable";
import {
  useCurrentInteractionHandlers,
  useInteractionHandlers,
} from "./use-interaction-handlers";
import { useCurrentNode, useNode } from "./use-node";
import {
  useCurrentNodeComputedState,
  useNodeComputedState,
} from "./use-node-computed-state";
import {
  useCurrentSelectionState,
  useSelectionState,
} from "./use-selection-state";

export function useRadio(id: string) {
  const node = useNode(id);
  const { value } = useSelectable();
  const isSelected = useSelectionState(id);
  const computedState = useNodeComputedState(id);
  const interactions = useInteractionHandlers(id);

  return {
    ...(node ?? {}),
    value,
    isSelected,
    disabled: computedState.disabled,
    hidden: computedState.hidden,
    forbidden: computedState.forbidden,
    onOptionClick: interactions.onOptionClick,
    onOptionClear: interactions.onOptionClear,
    onOptionToggle: interactions.onOptionToggle,
  };
}

export function useCurrentRadio() {
  const node = useCurrentNode();
  const { value } = useSelectable();
  const isSelected = useCurrentSelectionState();
  const computedState = useCurrentNodeComputedState();
  const interactions = useCurrentInteractionHandlers();

  return {
    ...(node ?? {}),
    value,
    isSelected,
    disabled: computedState.disabled,
    hidden: computedState.hidden,
    forbidden: computedState.forbidden,
    onOptionClick: interactions.onOptionClick,
    onOptionClear: interactions.onOptionClear,
    onOptionToggle: interactions.onOptionToggle,
  };
}
