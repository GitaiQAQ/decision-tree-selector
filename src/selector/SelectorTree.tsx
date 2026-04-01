import { useSelectorTree } from "./context/tree-provider";
import { SelectionRenderer } from "./components/SelectionRenderer";

export function SelectorTree() {
  const { root } = useSelectorTree();
  return <SelectionRenderer node={root} />;
}
