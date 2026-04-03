import { createElement, isValidElement, type ComponentType, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { cn } from "../../../lib/utils";
import { useCurrentNodeUi } from "../../hooks/use-node-ui";
import { useCurrentRadio } from "../../hooks/use-radio";
import type { NodeRenderProps } from "../../types";
import { usePortalSplitPresetContext } from "./portal-split-context";

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

export function PortalSplitTreeNode({ level }: NodeRenderProps) {
  const { symbol, isSelected, disabled, hidden, onOptionClick } = useCurrentRadio();
  const { renderLabel, renderDescription } = useCurrentNodeUi() as {
    renderLabel?: unknown;
    renderDescription?: unknown;
  };
  const context = usePortalSplitPresetContext();

  if (hidden) {
    return null;
  }

  const content = (
    <button
      type="button"
      disabled={Boolean(disabled)}
      className={cn("portal-split-node-button", {
        "is-selected": isSelected,
        "is-disabled": Boolean(disabled),
      })}
      onClick={onOptionClick}
    >
      <span className="portal-split-node-label">
        {renderRenderable(renderLabel, symbol ?? "Unnamed node")}
      </span>
      {renderDescription !== undefined && (
        <span className="portal-split-node-description">
          {renderRenderable(renderDescription, "")}
        </span>
      )}
    </button>
  );

  if (level === 0) {
    const navigationNode = (
      <div className="portal-split-navigation-item" data-selected={isSelected || undefined}>
        <span className="portal-split-navigation-index">0{Math.min(level + 1, 9)}</span>
        {content}
      </div>
    );

    return context?.navigationRoot
      ? createPortal(navigationNode, context.navigationRoot)
      : navigationNode;
  }

  return (
    <div
      className={cn("portal-split-detail-node", {
        "is-selected": isSelected,
        "is-disabled": Boolean(disabled),
      })}
    >
      {content}
    </div>
  );
}