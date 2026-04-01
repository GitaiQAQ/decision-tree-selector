import { Fragment } from "react";

import { CurrentNodeIdProvider } from "../context/current-node";
import { VirtualNodeType } from "../meta";
import { DefaultSelectionWrapper } from "./DefaultSelectionWrapper";
import { SelectionItem } from "./SelectionItem";
import { SelectionList } from "./SelectionList";
import type { RenderedNode } from "../types";

export function SelectionRenderer({ node }: { node: RenderedNode }) {
  const Wrapper = node.CustomWrapperRender ?? DefaultSelectionWrapper;
  const Item = node.CustomItemRender ?? SelectionItem;
  const Children = node.CustomChildrenRender ?? SelectionList;
  const Extra = node.CustomExtraRender;
  const isFragmentNode = node.symbol === VirtualNodeType.Fragment;
  const sharedProps = {
    level: node.level,
    internalLevel: node.internalLevel,
    order: node.order,
  };

  const renderedChildren = (
    <Fragment>
      {node.CustomChildrenRenderCompatibleViewExtension?.Before && (
        <node.CustomChildrenRenderCompatibleViewExtension.Before
          {...sharedProps}
        />
      )}
      <Children {...sharedProps}>
        {() =>
          node.children.map((child) => (
            <SelectionRenderer key={child.id} node={child} />
          ))
        }
      </Children>
      {node.CustomChildrenRenderCompatibleViewExtension?.After && (
        <node.CustomChildrenRenderCompatibleViewExtension.After
          {...sharedProps}
        />
      )}
    </Fragment>
  );

  if (isFragmentNode) {
    return (
      <CurrentNodeIdProvider value={node.id}>{renderedChildren}</CurrentNodeIdProvider>
    );
  }

  return (
    <CurrentNodeIdProvider value={node.id}>
      <Wrapper {...sharedProps}>
        <Fragment>
          {node.CustomItemRenderCompatibleViewExtension?.Before && (
            <node.CustomItemRenderCompatibleViewExtension.Before
              {...sharedProps}
            />
          )}
          <Item {...sharedProps} />
          {node.CustomItemRenderCompatibleViewExtension?.After && (
            <node.CustomItemRenderCompatibleViewExtension.After
              {...sharedProps}
            />
          )}
        </Fragment>

        {renderedChildren}

        {Extra && <Extra {...sharedProps} />}
      </Wrapper>
    </CurrentNodeIdProvider>
  );
}
