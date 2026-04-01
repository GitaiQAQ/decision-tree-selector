import { Meta } from "../meta";
import type { PluginContext, RuntimeNode } from "../types";
import {
  countEnabledSelectableLeavesInSubtreeExcludingPortalInNode,
  doesAnyPredicateReturnTrue,
  getDirectChildrenExcludingPortalMarks,
  isContainerNode,
} from "../runtime-helpers";

async function isSiblingDisplayable(
  node: RuntimeNode,
  ctx: PluginContext,
): Promise<boolean> {
  if (isContainerNode(node)) {
    return (
      (await countEnabledSelectableLeavesInSubtreeExcludingPortalInNode({
        ...ctx,
        node,
      })) > 0
    );
  }

  const disabled = await doesAnyPredicateReturnTrue(node.props[Meta.DISABLED], {
    ...ctx,
    node,
  }, {
    traceScope: Meta.DISABLED,
  });
  const hidden = await doesAnyPredicateReturnTrue(node.props[Meta.HIDDEN], {
    ...ctx,
    node,
  }, {
    traceScope: Meta.HIDDEN,
  });
  const forbidden = await doesAnyPredicateReturnTrue(
    node.props[Meta.FORBIDDEN],
    { ...ctx, node },
    { traceScope: Meta.FORBIDDEN },
  );
  return !disabled && !hidden && !forbidden;
}

export function childVisibilityMutex(ctx: PluginContext) {
  const children = getDirectChildrenExcludingPortalMarks(ctx.node);
  const getActiveSelectedSiblingIndex = () =>
    children.findIndex((child) =>
      child.selected.includes(ctx.root.selection.value ?? ""),
    );

  for (let index = 0; index < children.length; index += 1) {
    const currentChild = children[index];
    const previousSiblings = children.slice(0, index);
    const nextSiblings = children.slice(index + 1);

    const forbiddenPredicates = Array.isArray(
      currentChild.props[Meta.FORBIDDEN],
    )
      ? [
          ...(currentChild.props[Meta.FORBIDDEN] as Array<
            (ctx: PluginContext) => boolean | Promise<boolean>
          >),
        ]
      : [];
    forbiddenPredicates.push(async () => {
      const activeSelectedSiblingIndex = getActiveSelectedSiblingIndex();
      if (activeSelectedSiblingIndex <= index) {
        return false;
      }

      const activeSelectedSibling = children[activeSelectedSiblingIndex];
      return isSiblingDisplayable(activeSelectedSibling, {
        ...ctx,
        node: activeSelectedSibling,
      });
    });
    currentChild.props[Meta.FORBIDDEN] = forbiddenPredicates;

    if (previousSiblings.length > 0) {
      const disabledPredicates = Array.isArray(
        currentChild.props[Meta.DISABLED],
      )
        ? [
            ...(currentChild.props[Meta.DISABLED] as Array<
              (ctx: PluginContext) => boolean | Promise<boolean>
            >),
          ]
        : [];
      disabledPredicates.push(async () => {
        const activeSelectedSiblingIndex = getActiveSelectedSiblingIndex();
        if (activeSelectedSiblingIndex === index) {
          return false;
        }

        for (const sibling of previousSiblings) {
          if (await isSiblingDisplayable(sibling, { ...ctx, node: sibling })) {
            return true;
          }
        }
        return false;
      });
      currentChild.props[Meta.DISABLED] = disabledPredicates;
    }
  }
}
