import type { NodeWrapperRenderProps } from "../../types";

export function PortalSplitTreeNodeWrapper({ children, level }: NodeWrapperRenderProps) {
  if (level === 0) {
    return <>{children}</>;
  }

  return <div className="portal-split-detail-wrapper">{children}</div>;
}