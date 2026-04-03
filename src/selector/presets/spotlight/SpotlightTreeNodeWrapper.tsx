import { cn } from "../../../lib/utils";
import { useCurrentRadio } from "../../hooks/use-radio";
import type { NodeWrapperRenderProps } from "../../types";

export function SpotlightTreeNodeWrapper({ children, level }: NodeWrapperRenderProps) {
  const { hidden } = useCurrentRadio();

  if (hidden) {
    return null;
  }

  return (
    <div
      className={cn("tree-spotlight-wrapper", {
        "is-root": level === 0,
      })}
      data-tree-spotlight-level={Math.min(level, 6)}
    >
      {children}
    </div>
  );
}
