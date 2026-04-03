import { useCurrentRadio } from "../../hooks/use-radio";
import type { NodeChildrenRenderProps } from "../../types";

export function SpotlightTreeNodeGroup({ children, level }: NodeChildrenRenderProps) {
  const { hidden } = useCurrentRadio();
  const items = children();

  if (hidden || items.length === 0) {
    return null;
  }

  return (
    <ul className="tree-spotlight-group" data-tree-spotlight-level={Math.min(level, 6)}>
      {items}
    </ul>
  );
}
