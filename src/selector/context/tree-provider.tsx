import { createReactContext } from "../create-react-context";
import type { BootstrapResult, RuntimeRootState } from "../types";

export interface SelectorTreeState extends BootstrapResult {
  runtimeRoot: RuntimeRootState;
}

export const [useSelectorTree, TreeProvider] =
  createReactContext<SelectorTreeState>("SelectorTree");
