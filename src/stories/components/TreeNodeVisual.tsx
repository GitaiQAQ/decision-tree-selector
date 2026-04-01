import { Children, useState } from "react";
import { useCurrentNodeId, useNode, useCurrentRadio, SelectionItem } from "../../index";
import {
  SelectionItemSummary,
  TreeToggleIndicator,
} from "../../selector/components/SelectionItem";
import type { NodeWrapperRenderProps } from "../../selector/types";
import { cn } from "@/lib/utils";

interface TreeNodeWrapperProps extends NodeWrapperRenderProps {
  isLastChild?: boolean;
}

export function TreeNodeWrapper({
  children,
  level,
  isLastChild = false,
}: TreeNodeWrapperProps) {
  const node = useNode(useCurrentNodeId());
  const { hidden, disabled, forbidden } = useCurrentRadio();
  const hasChildren = (node?.children?.length ?? 0) > 0;
  const [isOpen, setIsOpen] = useState(true);
  const [, renderedSubtree] = Children.toArray(children);
  const suppressChildBranch = Boolean(disabled || forbidden);
  const hasSuppressedChildBranch = hasChildren && suppressChildBranch;
  const suppressedBranchClassName = hasSuppressedChildBranch
    ? "border-dashed border-muted-foreground/60 bg-muted/20"
    : undefined;

  if (hidden) return <>{children}</>;

  if (!hasChildren) {
    return (
      <div
        className={cn("tree-wrapper", { "is-last-child": isLastChild })}
        data-tree-level={Math.min(level, 5)}
      >
        <div className="tree-node-visual-row">
          <div className="min-w-0 flex-1">
            <SelectionItem
              nodeClassName={suppressedBranchClassName}
              leadingVisual={
                <span className="tree-summary-spacer" aria-hidden="true" />
              }
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <details
      className={cn("tree-wrapper", "tree-details", {
        "is-last-child": isLastChild,
      })}
      data-tree-level={Math.min(level, 5)}
      open={isOpen}
      onToggle={(event) => {
        setIsOpen(event.currentTarget.open);
      }}
    >
      <SelectionItemSummary
        nodeClassName={suppressedBranchClassName}
        leadingVisual={
          <TreeToggleIndicator>
            <span className="tree-summary-indicator" aria-hidden="true" />
          </TreeToggleIndicator>
        }
      />

      {isOpen && renderedSubtree && !suppressChildBranch ? (
        <div className="tree-children-visual">{renderedSubtree}</div>
      ) : null}
    </details>
  );
}

export function TreeDefaultWrapper({
  children,
  level,
  isLastChild = false,
}: NodeWrapperRenderProps & { isLastChild?: boolean }) {
  const { hidden } = useCurrentRadio();
  if (hidden) return <>{children}</>;
  return (
    <div
      className={cn("tree-wrapper", { "is-last-child": isLastChild })}
      data-tree-level={Math.min(level, 5)}
    >
      {children}
    </div>
  );
}
