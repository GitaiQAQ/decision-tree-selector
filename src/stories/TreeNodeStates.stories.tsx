import { useState, useCallback } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  SelectorProvider,
  dsl,
  type Predicate,
} from "../index";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { StoryIntroCard, StorySceneGrid, StoryTreeCard } from "./storybook-utils";
import { applyTreeVisuals, applyTreeVisualsList } from "./tree-visuals";

const disabledPredicate: Predicate = () => true;
const forbiddenPredicate: Predicate = () => true;
const AUTHORIZATION_DELAY_MS = 800;

const disabledHiddenForbiddenTree = applyTreeVisuals(dsl.group(
  { renderLabel: "Node states demo" },
  [
    dsl.node(
      "Normal",
      {
        renderLabel: (
          <div className="flex items-center gap-2">
            Normal node
            <Badge variant="outline" className="text-xs">default</Badge>
          </div>
        ),
        renderDescription: "Fully interactive. Click to select.",
      },
      applyTreeVisualsList([
        dsl.node("Child A", {
          renderLabel: "Child A — also normal",
          renderDescription: "No predicates applied.",
        }),
        dsl.node("Child B", {
          renderLabel: "Child B — also normal",
          renderDescription: "No predicates applied.",
        }),
      ]),
    ),
    dsl.node(
      "Disabled",
      {
        renderLabel: (
          <div className="flex items-center gap-2">
            Disabled node
            <Badge variant="destructive" className="text-xs">disabled</Badge>
          </div>
        ),
        renderDescription: "Visible but not interactive. Blocked by predicate.",
        disabled: disabledPredicate,
      },
      applyTreeVisualsList([
        dsl.node("Disabled Child", {
          renderLabel: "Disabled Child",
          renderDescription: "Also disabled via inheritance.",
          disabled: disabledPredicate,
        }),
      ]),
    ),
    dsl.node(
      "Hidden",
      {
        renderLabel: (
          <div className="flex items-center gap-2">
            Hidden node
            <Badge variant="secondary" className="text-xs">hidden</Badge>
          </div>
        ),
        renderDescription: "Hidden from the tree entirely. Controlled by predicate.",
        hidden: () => true,
      },
      applyTreeVisualsList([
        dsl.node("Hidden Child", {
          renderLabel: "Hidden Child",
          renderDescription: "Also hidden.",
          hidden: () => true,
        }),
      ]),
    ),
    dsl.node(
      "Forbidden",
      {
        renderLabel: (
          <div className="flex items-center gap-2">
            Forbidden node
            <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">forbidden</Badge>
          </div>
        ),
        renderDescription: "Visible but selection is blocked. Prevents leaf resolution.",
        forbidden: forbiddenPredicate,
      },
      applyTreeVisualsList([
        dsl.node("Forbidden Child", {
          renderLabel: "Forbidden Child",
          renderDescription: "Also forbidden.",
          forbidden: forbiddenPredicate,
        }),
      ]),
    ),
  ],
));

function AsyncResolveStory() {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastResolved, setLastResolved] = useState<string>("");

  const premiumPredicate: Predicate = () => {
    if (!authorized) return true;
    return false;
  };

  const handleAuthorize = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setAuthorized(true);
      setLastResolved(new Date().toLocaleTimeString());
      setLoading(false);
    }, AUTHORIZATION_DELAY_MS);
  }, []);

  return (
    <div className="grid gap-4">
      <StoryIntroCard
        title="Async predicate — click to resolve"
        description={
          "The \u201cPremium Features\u201d node is disabled by an async predicate. While blocked, its child branch is hidden from the demo tree and represented by a dashed parent border. Click \u201cAuthorize Premium\u201d to flip the state — the predicate will await and then resolve, re-enabling the node and restoring its child branch."
        }
      >
        <Button onClick={handleAuthorize} disabled={loading || authorized}>
          {loading ? "Verifying..." : authorized ? "Authorized ✓" : "Authorize Premium"}
        </Button>
        {lastResolved && (
          <Badge variant="secondary">Last resolved at {lastResolved}</Badge>
        )}
      </StoryIntroCard>

      <SelectorProvider
        tree={applyTreeVisuals(dsl.group(
          { renderLabel: "Feature tree" },
          [
            dsl.node("Standard Plan", {
              renderLabel: (
                <div className="flex items-center gap-2">
                  Standard Plan
                  <Badge variant="outline" className="text-xs">always available</Badge>
                </div>
              ),
              renderDescription: "Basic features, no predicate needed.",
            }),
            dsl.node(
              "Premium Features",
              {
                renderLabel: (
                  <div className="flex items-center gap-2">
                    Premium Features
                    {!authorized && (
                      <Badge variant="destructive" className="text-xs">locked</Badge>
                    )}
                    {authorized && (
                      <Badge variant="default" className="text-xs bg-green-600">unlocked</Badge>
                    )}
                  </div>
                ),
                  renderDescription: authorized
                    ? "Authorization granted. Predicate resolved."
                    : "Awaiting authorization check. Child branch hidden in demo until resolved.",
                disabled: premiumPredicate,
              },
              applyTreeVisualsList([
                dsl.node("Advanced Analytics", {
                  renderLabel: "Advanced Analytics",
                  renderDescription: "Only visible when premium is unlocked.",
                }),
                dsl.node("Priority Support", {
                  renderLabel: "Priority Support",
                  renderDescription: "Premium-only support tier.",
                }),
              ]),
            ),
          ],
        ))}
        autoSelectDefault={false}
      >
        <StorySceneGrid
          main={<StoryTreeCard />}
          aside={<Card>
            <CardHeader>
              <Badge variant="secondary" className="w-fit">State</Badge>
              <CardTitle>{authorized ? "Premium authorized" : "Standard mode"}</CardTitle>
              <CardDescription>
                The async predicate will re-evaluate when authorization state changes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Authorized:</span>
                <span
                  className={cn(
                    {
                      "text-green-600 font-medium": authorized,
                      "text-muted-foreground": !authorized,
                    },
                  )}
                >
                  {authorized ? "Yes" : "No"}
                </span>
                <span className="text-muted-foreground">Predicate:</span>
                <span className="text-muted-foreground">
                  {loading ? "Resolving..." : authorized ? "Resolved (enabled)" : "Blocking"}
                </span>
              </div>
            </CardContent>
          </Card>}
        />
      </SelectorProvider>
    </div>
  );
}

function TreeVisualStory({
  tree,
  title,
  description,
}: {
  tree: ReturnType<typeof dsl.group>;
  title: string;
  description: string;
}) {
  return (
    <div className="grid gap-4">
      <StoryIntroCard title={title} description={description} />
      <SelectorProvider tree={tree} autoSelectDefault={false}>
        <StorySceneGrid
          main={<StoryTreeCard />}
          aside={<Card>
            <CardHeader>
              <Badge variant="secondary" className="w-fit">Legend</Badge>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">default</Badge>
                <span className="text-muted-foreground">Normal — fully interactive</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="text-xs">disabled</Badge>
                <span className="text-muted-foreground">Visible but blocked — child branch is hidden and parent uses dashed border cue</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">hidden</Badge>
                <span className="text-muted-foreground">Not rendered at all</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">forbidden</Badge>
                <span className="text-muted-foreground">Visible — selection is prevented and child branch is hidden with dashed border cue</span>
              </div>
            </CardContent>
          </Card>}
        />
      </SelectorProvider>
    </div>
  );
}

const meta = {
  title: "Runtime/Node State Behaviors",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Demonstrates disabled, hidden, and forbidden node states. In this demo, disabled and forbidden parent nodes stay visible with a dashed border while their child branches are not rendered; hidden nodes are removed from the DOM entirely.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const NodeStates: Story = {
  render: () => (
    <TreeVisualStory
      tree={disabledHiddenForbiddenTree as ReturnType<typeof dsl.group>}
      title="Node states — disabled, hidden, forbidden"
      description="A single tree demonstrating all three predicate-driven node states. Disabled and forbidden parent nodes keep a dashed border cue while their child branches are hidden from the demo tree."
    />
  ),
};

export const AsyncPredicateResolve: Story = {
  render: () => <AsyncResolveStory />,
};
