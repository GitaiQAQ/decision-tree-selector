import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { bootstrapFromDsl } from "./bootstrap-from-dsl";
import { SelectableProvider } from "./context/selectable";
import { TreeProvider } from "./context/tree-provider";
import { Meta } from "./meta";
import {
  buildPluginContextForNode,
  resolveValueFromMaybeDynamicFunctionOrPromise,
} from "./runtime-helpers";
import type {
  RuntimeRootState,
  SelectorProviderProps,
  SelectorSymbol,
} from "./types";

export function SelectorProvider({
  tree,
  value,
  defaultValue,
  onValueChange,
  modifiers = [],
  autoSelectDefault = true,
  children,
}: SelectorProviderProps) {
  const [internalValue, setInternalValue] = useState<
    SelectorSymbol | undefined
  >(defaultValue);
  const isControlled = value !== undefined;
  const selectedValue = isControlled ? value : internalValue;

  const setSelectedValue = useCallback(
    (nextValue: SelectorSymbol | undefined, previousValue?: SelectorSymbol) => {
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue, previousValue);
    },
    [isControlled, onValueChange],
  );

  const runtimeRootRef = useRef<RuntimeRootState>({
    selection: {
      value: selectedValue,
      setValue: setSelectedValue,
    },
  });

  runtimeRootRef.current.selection.value = selectedValue;
  runtimeRootRef.current.selection.setValue = setSelectedValue;

  const selectorTreeState = useMemo(
    () => ({
      ...bootstrapFromDsl(tree, { modifiers }, runtimeRootRef.current),
      runtimeRoot: runtimeRootRef.current,
    }),
    [modifiers, tree],
  );

  useEffect(() => {
    if (!autoSelectDefault || selectedValue !== undefined) {
      return;
    }

    const rootNode = selectorTreeState.nodes.r;
    if (!rootNode) {
      return;
    }

    let cancelled = false;
    const rootContext = buildPluginContextForNode(
      rootNode,
      selectorTreeState.nodes,
      runtimeRootRef.current,
    );
    void resolveValueFromMaybeDynamicFunctionOrPromise<
      SelectorSymbol | undefined
    >(rootNode.props[Meta.DEFAULT_ON], rootContext, {
      traceId: rootNode.id ? `${rootNode.id}::${Meta.DEFAULT_ON}` : undefined,
    }).then((nextValue) => {
      if (
        !cancelled &&
        nextValue !== undefined &&
        runtimeRootRef.current.selection.value === undefined
      ) {
        setSelectedValue(nextValue, undefined);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    autoSelectDefault,
    selectedValue,
    selectorTreeState.nodes,
    setSelectedValue,
  ]);

  return (
    <TreeProvider value={selectorTreeState}>
      <SelectableProvider
        value={{ value: selectedValue, setValue: setSelectedValue }}
      >
        {children}
      </SelectableProvider>
    </TreeProvider>
  );
}
