import { useEffect } from "react";
import { createPortal } from "react-dom";

import { useCurrentNodeUi } from "../../hooks/use-node-ui";
import { useCurrentRadio } from "../../hooks/use-radio";
import type { NodeChildrenRenderProps } from "../../types";
import { usePortalSplitPresetContext } from "./portal-split-context";

export function PortalSplitTreeNodeGroup({
  children,
  level,
}: NodeChildrenRenderProps) {
  const { hidden, isSelected, symbol } = useCurrentRadio();
  const { renderLabel, renderDescription } = useCurrentNodeUi() as {
    renderLabel?: unknown;
    renderDescription?: unknown;
  };
  const context = usePortalSplitPresetContext();
  const items = children();

  useEffect(() => {
    if (!context || level !== 0 || !isSelected) {
      return;
    }

    return context.registerDetailContent();
  }, [context, isSelected, level]);

  if (hidden || items.length === 0) {
    return null;
  }

  if (level === 0) {
    if (!isSelected) {
      return null;
    }

    const detailPanel = (
      <section className="portal-split-detail-panel">
        <header className="portal-split-detail-header">
          <p className="portal-split-detail-kicker">Active branch</p>
          <h4 className="portal-split-detail-title">
            {typeof renderLabel === "string" || typeof renderLabel === "number"
              ? renderLabel
              : symbol ?? "Branch detail"}
          </h4>
          {renderDescription !== undefined && typeof renderDescription === "string" && (
            <p className="portal-split-detail-description">{renderDescription}</p>
          )}
        </header>

        <ul className="portal-split-detail-list">{items}</ul>
      </section>
    );

    return context?.detailRoot
      ? createPortal(detailPanel, context.detailRoot)
      : detailPanel;
  }

  return <ul className="portal-split-detail-list">{items}</ul>;
}