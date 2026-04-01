import { SelectorProvider } from "./selector/SelectorProvider";
import { SelectorTree } from "./selector/SelectorTree";
import { useSelectable } from "./selector/context/selectable";
import { useSelectorDebug } from "./selector/debug";
import { createDemoTree } from "./selector/demo/create-demo-tree";

const demoTree = createDemoTree();

function SelectionStatePanel() {
  const { value, setValue } = useSelectable();
  const selectorDebug = useSelectorDebug();

  return (
    <div className="panel">
      <div className="pill">Current selection</div>
      <h3>{value ?? "Nothing selected yet"}</h3>
      <p>
        This panel is driven by the same generic runtime state the selector tree
        uses.
      </p>
      <button type="button" onClick={() => setValue(undefined, value)}>
        Clear selection
      </button>
      <h4>Runtime snapshot</h4>
      <pre className="code-block">
        {JSON.stringify(selectorDebug.snapshotState(), null, 2)}
      </pre>
    </div>
  );
}

export function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="pill">decision-tree-selector</div>
        <h1>Open-source runtime + demo preset cut</h1>
        <p>
          This first migration slice keeps the generic selector engine and a
          tiny demo config, while leaving campaign entities, feature gating,
          tracking, and TT-specific host wrappers behind.
        </p>
      </header>

      <SelectorProvider tree={demoTree}>
        <div className="app-grid">
          <div className="panel">
            <SelectorTree />
          </div>
          <SelectionStatePanel />
        </div>
      </SelectorProvider>
    </div>
  );
}
