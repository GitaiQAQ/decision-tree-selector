import { createElement, isValidElement, type ComponentType, type ReactNode } from "react";

import { cn } from "../../../lib/utils";
import { useCurrentNodeUi } from "../../hooks/use-node-ui";
import { useCurrentRadio } from "../../hooks/use-radio";

function renderRenderable(renderable: unknown, fallback: string): ReactNode {
  if (renderable === undefined || renderable === null || renderable === false) {
    return fallback;
  }

  if (isValidElement(renderable)) {
    return renderable;
  }

  if (typeof renderable === "function") {
    return createElement(renderable as ComponentType<Record<string, never>>);
  }

  if (typeof renderable === "string" || typeof renderable === "number") {
    return renderable;
  }

  return fallback;
}

export function SpotlightTreeNode() {
  const { symbol, isSelected, disabled, hidden, onOptionClick } = useCurrentRadio();
  const { renderLabel, renderDescription } = useCurrentNodeUi() as {
    renderLabel?: unknown;
    renderDescription?: unknown;
  };

  if (hidden) {
    return null;
  }

  return (
    <div
      className={cn("tree-spotlight-node", {
        "is-selected": isSelected,
        "is-disabled": Boolean(disabled),
      })}
    >
      <button
        type="button"
        disabled={Boolean(disabled)}
        className="tree-spotlight-button"
        onClick={onOptionClick}
      >
        <span className="tree-spotlight-kicker">Option</span>
        <span className="tree-spotlight-label">
          {renderRenderable(renderLabel, symbol ?? "Unnamed node")}
        </span>
        {renderDescription !== undefined && (
          <span className="tree-spotlight-description">
            {renderRenderable(renderDescription, "")}
          </span>
        )}
      </button>
    </div>
  );
}
