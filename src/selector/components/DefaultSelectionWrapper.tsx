import type { NodeWrapperRenderProps } from "../types";

export function DefaultSelectionWrapper({ children }: NodeWrapperRenderProps) {
  return <div className="tree-wrapper">{children}</div>;
}
