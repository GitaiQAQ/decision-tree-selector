import type { ReactNode } from "react";

import {
  PortalSplitPresetContextProvider,
  usePortalSplitPresetContext,
} from "./portal-split-context";

interface PortalSplitPresetFrameProps {
  children: ReactNode;
  navigationTitle?: string;
  navigationDescription?: string;
  detailTitle?: string;
  detailDescription?: string;
  emptyDetailTitle?: string;
  emptyDetailDescription?: string;
}

function PortalSplitPresetFrameLayout({
  children,
  navigationTitle = "Decision map",
  navigationDescription = "Top-level branches render into this navigation rail.",
  detailTitle = "Branch detail",
  detailDescription = "The active branch is projected here through React Portal.",
  emptyDetailTitle = "Choose a branch",
  emptyDetailDescription = "Select a top-level branch from the left rail to inspect its subtree.",
}: PortalSplitPresetFrameProps) {
  const context = usePortalSplitPresetContext();

  if (!context) {
    return <>{children}</>;
  }

  return (
    <div className="portal-split-frame">
      <section className="portal-split-column portal-split-column-nav">
        <header className="portal-split-column-header">
          <p className="portal-split-column-kicker">Portal rail</p>
          <h3 className="portal-split-column-title">{navigationTitle}</h3>
          <p className="portal-split-column-description">{navigationDescription}</p>
        </header>

        <div ref={context.setNavigationRoot} className="portal-split-navigation-root" />
      </section>

      <section className="portal-split-column portal-split-column-detail">
        <header className="portal-split-column-header">
          <p className="portal-split-column-kicker">Portal detail</p>
          <h3 className="portal-split-column-title">{detailTitle}</h3>
          <p className="portal-split-column-description">{detailDescription}</p>
        </header>

        {context.detailContentCount === 0 && (
          <div className="portal-split-empty-state">
            <p className="portal-split-empty-title">{emptyDetailTitle}</p>
            <p className="portal-split-empty-description">{emptyDetailDescription}</p>
          </div>
        )}

        <div ref={context.setDetailRoot} className="portal-split-detail-root" />
      </section>

      <div className="portal-split-source">{children}</div>
    </div>
  );
}

export function PortalSplitPresetFrame(props: PortalSplitPresetFrameProps) {
  return (
    <PortalSplitPresetContextProvider>
      <PortalSplitPresetFrameLayout {...props} />
    </PortalSplitPresetContextProvider>
  );
}