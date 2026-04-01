import { createElement, isValidElement } from "react";
import type { ComponentType, ReactNode } from "react";

import { cn } from "../../lib/utils";
import { SELECTOR_CLASS_NAMES } from "../meta";
import { useCurrentNodeUi } from "../hooks/use-node-ui";
import { useCurrentRadio } from "../hooks/use-radio";

const TREE_TOGGLE_INDICATOR_ATTR = "data-tree-toggle-indicator";

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

interface SelectionItemSharedProps {
  fallbackSymbol?: string;
  leadingVisual?: ReactNode;
  nodeClassName?: string;
}

export function SelectionItem({
  fallbackSymbol,
  leadingVisual,
  nodeClassName,
}: SelectionItemSharedProps = {}) {
  const { symbol, isSelected, disabled, hidden, onOptionClick } =
    useCurrentRadio();
  const resolvedFallbackSymbol = fallbackSymbol ?? symbol ?? "Unnamed node";

  return (
    <div
      className={cn(
        SELECTOR_CLASS_NAMES.treeNode,
        nodeClassName,
        {
          [SELECTOR_CLASS_NAMES.selected]: isSelected,
          [SELECTOR_CLASS_NAMES.disabled]: Boolean(disabled),
          [SELECTOR_CLASS_NAMES.hidden]: Boolean(hidden),
        },
      )}
    >
      <button
        className={SELECTOR_CLASS_NAMES.treeButton}
        disabled={Boolean(disabled)}
        type="button"
        onClick={onOptionClick}
      >
        <SelectionItemContent
          fallbackSymbol={resolvedFallbackSymbol}
          leadingVisual={leadingVisual}
        />
      </button>
    </div>
  );
}

export function SelectionItemView({
  fallbackSymbol = "Unnamed node",
  leadingVisual,
}: {
  fallbackSymbol?: string;
  leadingVisual?: ReactNode;
}) {
  const { isSelected, disabled, hidden } = useCurrentRadio();

  return (
    <div
      className={cn(
        SELECTOR_CLASS_NAMES.treeNode,
        {
          [SELECTOR_CLASS_NAMES.selected]: isSelected,
          [SELECTOR_CLASS_NAMES.disabled]: Boolean(disabled),
          [SELECTOR_CLASS_NAMES.hidden]: Boolean(hidden),
        },
      )}
    >
      <div className={SELECTOR_CLASS_NAMES.treeButton}>
        <SelectionItemContent
          fallbackSymbol={fallbackSymbol}
          leadingVisual={leadingVisual}
        />
      </div>
    </div>
  );
}

export function SelectionItemSummary({
  fallbackSymbol,
  leadingVisual,
  nodeClassName,
}: SelectionItemSharedProps = {}) {
  const { symbol, isSelected, disabled, hidden, onOptionClick } =
    useCurrentRadio();
  const resolvedFallbackSymbol = fallbackSymbol ?? symbol ?? "Unnamed node";

  return (
    <summary
      className={cn(
        "tree-node-visual-row tree-summary",
        SELECTOR_CLASS_NAMES.treeNode,
        nodeClassName,
        {
          [SELECTOR_CLASS_NAMES.selected]: isSelected,
          [SELECTOR_CLASS_NAMES.disabled]: Boolean(disabled),
          [SELECTOR_CLASS_NAMES.hidden]: Boolean(hidden),
        },
      )}
      onClick={(event) => {
        const target = event.target;
        if (target instanceof HTMLElement && target.closest(`[${TREE_TOGGLE_INDICATOR_ATTR}]`)) {
          return;
        }

        event.preventDefault();

        if (!disabled) {
          onOptionClick();
        }
      }}
    >
      <div className={SELECTOR_CLASS_NAMES.treeButton}>
        <SelectionItemContent
          fallbackSymbol={resolvedFallbackSymbol}
          leadingVisual={leadingVisual}
        />
      </div>
    </summary>
  );
}

export function TreeToggleIndicator({ children }: { children: ReactNode }) {
  return <span {...{ [TREE_TOGGLE_INDICATOR_ATTR]: "true" }}>{children}</span>;
}

function SelectionItemContent({
  fallbackSymbol,
  leadingVisual,
}: {
  fallbackSymbol: string;
  leadingVisual?: ReactNode;
}) {
  const { renderLabel, renderDescription } = useCurrentNodeUi() as {
    renderLabel?: unknown;
    renderDescription?: unknown;
  };

  return (
    <span className="flex items-start gap-2">
      {leadingVisual}
      <span className="grid gap-1">
        <span className={SELECTOR_CLASS_NAMES.treeLabel}>
          {renderRenderable(renderLabel, fallbackSymbol)}
        </span>
        {renderDescription !== undefined && (
          <span className={SELECTOR_CLASS_NAMES.treeDescription}>
            {renderRenderable(renderDescription, "")}
          </span>
        )}
      </span>
    </span>
  );
}
