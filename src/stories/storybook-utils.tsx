import type { ReactNode } from "react";

import {
  SelectorProvider,
  SelectorTree,
  useSelectable,
  useSelectorDebug,
} from "../index";
import { CurrentNodeIdProvider } from "../selector/context/current-node";
import type { RuntimeNode, SelectorSymbol } from "../selector/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SelectorStorySceneProps {
  tree: RuntimeNode;
  title?: string;
  description?: string;
  badge?: string;
  value?: SelectorSymbol;
  defaultValue?: SelectorSymbol;
  autoSelectDefault?: boolean;
  rightPanel?: ReactNode;
  treePanelTitle?: string;
  treePanelDescription?: string;
  treePanelBadge?: string;
}

interface CurrentNodeStoryFrameProps {
  tree: RuntimeNode;
  currentNodeId: string;
  children: ReactNode;
  value?: SelectorSymbol;
  defaultValue?: SelectorSymbol;
  autoSelectDefault?: boolean;
}

function StorySelectionPanel() {
  const { value, setValue } = useSelectable();
  const selectorDebug = useSelectorDebug();

  return (
    <JsonDebugCard
      badge="Selection state"
      title={value ?? "Nothing selected yet"}
      description="This panel uses the runtime selection state and debug snapshot API."
      data={selectorDebug.snapshotState()}
      dataLabel="Runtime snapshot"
      actions={(
        <Button variant="outline" size="sm" onClick={() => setValue(undefined, value)}>
          Clear selection
        </Button>
      )}
    />
  );
}

export function StoryIntroCard({
  badge,
  title,
  description,
  children,
}: {
  badge?: string;
  title?: string;
  description?: string;
  children?: ReactNode;
}) {
  if (!badge && !title && !description && !children) {
    return null;
  }

  return (
    <Card className="max-w-5xl">
      <CardHeader>
        {badge && (
          <Badge variant="secondary" className="w-fit">
            {badge}
          </Badge>
        )}
        {title && <CardTitle>{title}</CardTitle>}
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      {children && <CardContent className="flex flex-wrap gap-3">{children}</CardContent>}
    </Card>
  );
}

export function StorySceneGrid({
  main,
  aside,
}: {
  main: ReactNode;
  aside: ReactNode;
}) {
  return (
    <div className="grid max-w-6xl items-start gap-6 lg:grid-cols-[minmax(340px,460px)_minmax(280px,1fr)]">
      {main}
      {aside}
    </div>
  );
}

export function StoryTreeCard({
  badge,
  title,
  description,
}: {
  badge?: string;
  title?: string;
  description?: string;
}) {
  return (
    <Card>
      {(badge || title || description) && (
        <CardHeader>
          {badge && (
            <Badge variant="secondary" className="w-fit">
              {badge}
            </Badge>
          )}
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={badge || title || description ? "pt-0" : "pt-5"}>
        <SelectorTree />
      </CardContent>
    </Card>
  );
}

export function JsonDebugCard({
  badge,
  title,
  description,
  data,
  dataLabel,
  actions,
}: {
  badge?: string;
  title: string;
  description?: string;
  data: unknown;
  dataLabel?: string;
  actions?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        {badge && (
          <Badge variant="secondary" className="w-fit">
            {badge}
          </Badge>
        )}
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-3">
        {actions}
        <div className="space-y-2">
          {dataLabel && <p className="text-sm font-medium">{dataLabel}</p>}
          <pre className="max-h-72 overflow-auto rounded-md border bg-muted p-3 text-xs leading-5">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

export function SelectorStoryScene({
  tree,
  title,
  description,
  badge,
  value,
  defaultValue,
  autoSelectDefault = true,
  rightPanel,
  treePanelTitle,
  treePanelDescription,
  treePanelBadge,
}: SelectorStorySceneProps) {
  return (
    <div className="grid gap-4">
      <StoryIntroCard badge={badge} title={title} description={description} />

      <SelectorProvider
        tree={tree}
        value={value}
        defaultValue={defaultValue}
        autoSelectDefault={autoSelectDefault}
      >
        <StorySceneGrid
          main={(
            <StoryTreeCard
              badge={treePanelBadge}
              title={treePanelTitle}
              description={treePanelDescription}
            />
          )}
          aside={rightPanel ?? <StorySelectionPanel />}
        />
      </SelectorProvider>
    </div>
  );
}

export function CurrentNodeStoryFrame({
  tree,
  currentNodeId,
  children,
  value,
  defaultValue,
  autoSelectDefault = true,
}: CurrentNodeStoryFrameProps) {
  return (
    <SelectorProvider
      tree={tree}
      value={value}
      defaultValue={defaultValue}
      autoSelectDefault={autoSelectDefault}
    >
      <Card className="max-w-md">
        <CardContent className="pt-5">
          <CurrentNodeIdProvider value={currentNodeId}>
            <div className="tree-wrapper">{children}</div>
          </CurrentNodeIdProvider>
        </CardContent>
      </Card>
    </SelectorProvider>
  );
}
