import { useCurrentRadio } from "../hooks/use-radio";
import type { NodeChildrenRenderProps } from "../types";

export function SelectionList({ children }: NodeChildrenRenderProps) {
  const { hidden } = useCurrentRadio();
  const items = children();

  if (hidden || items.length === 0) {
    return null;
  }

  return <ul className="tree-group">{items}</ul>;
}
