import { createReactContext } from "../create-react-context";
import type { RuntimeSelectionState } from "../types";

export const [useSelectable, SelectableProvider] =
  createReactContext<RuntimeSelectionState>("Selectable");
