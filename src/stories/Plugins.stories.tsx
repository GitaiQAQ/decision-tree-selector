import { useMemo } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  SelectorProvider,
  dsl,
  type RuntimeNode,
  useSelectable,
  useSelectorTree,
  useSwitchable,
} from "../index";
import { CurrentNodeIdProvider } from "../selector/context/current-node";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StorySceneGrid, StoryTreeCard } from "./storybook-utils";
import { applyTreeVisuals } from "./tree-visuals";

const SWITCHABLE_SYMBOLS = {
  express: "Express",
  standard: "Standard",
  hiddenOption: "Hidden option",
  expressLocker: "Express + Locker",
  expressDoor: "Express + Door",
  expressDeepLeaf: "Express deep leaf",
  standardDeepLeaf: "Standard deep leaf",
} as const;

const switchableTree = applyTreeVisuals(
  dsl.group({}, [
    dsl.node("Delivery Mode", {
      renderLabel: "Delivery Mode",
      renderDescription:
        "Plugin capability sample for switching between sibling delivery branches.",
    }, [
      dsl.switchableGroup({}, [
        dsl.switchableOption(
          SWITCHABLE_SYMBOLS.express,
          {
            default: true,
            renderLabel: "Express",
            renderDescription: "Default switchable option with nested delivery targets.",
          },
          [
            dsl.mutexGroup({}, [
              dsl.optionMutex(SWITCHABLE_SYMBOLS.expressLocker, {
                renderLabel: "Express + Locker",
              }),
              dsl.optionMutex(SWITCHABLE_SYMBOLS.expressDoor, {
                renderLabel: "Express + Door",
              }),
            ]),
            dsl.node(SWITCHABLE_SYMBOLS.expressDeepLeaf, {
              renderLabel: "Express deep leaf",
            }),
          ],
        ),
        dsl.switchableOption(
          SWITCHABLE_SYMBOLS.standard,
          {
            renderLabel: "Standard",
            renderDescription: "Alternative branch used for explicit target switching.",
          },
          [
            dsl.node(SWITCHABLE_SYMBOLS.standardDeepLeaf, {
              renderLabel: "Standard deep leaf",
            }),
          ],
        ),
        dsl.switchableOption(SWITCHABLE_SYMBOLS.hiddenOption, {
          renderLabel: "Hidden option",
          hidden: () => true,
        }),
      ]),
    ]),
  ]),
);

function SwitchableActionButtons({ deepNodeId }: { deepNodeId?: string }) {
  const { switchFromCurrentNode, switchFromNode } = useSwitchable();

  return (
    <div className="contents">
      <Button
        size="sm"
        variant="outline"
        disabled={!deepNodeId}
        onClick={() => {
          if (deepNodeId) {
            void switchFromNode(deepNodeId);
          }
        }}
      >
        Switch from deep node (next)
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={!deepNodeId}
        onClick={() => {
          if (deepNodeId) {
            void switchFromNode(deepNodeId, SWITCHABLE_SYMBOLS.standard);
          }
        }}
      >
        Switch to Standard
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={!deepNodeId}
        onClick={() => {
          if (deepNodeId) {
            void switchFromNode(deepNodeId, SWITCHABLE_SYMBOLS.hiddenOption);
          }
        }}
      >
        Switch to hidden target (fallback)
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          void switchFromCurrentNode();
        }}
      >
        Switch from current node
      </Button>
    </div>
  );
}

function SwitchableStoryPanel() {
  const { value } = useSelectable();
  const { nodes } = useSelectorTree();

  const deepNode = useMemo(
    () =>
      Object.values(nodes).find(
        (node) => node.symbol === SWITCHABLE_SYMBOLS.expressDeepLeaf,
      ),
    [nodes],
  );

  return (
    <Card>
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          Switchable actions
        </Badge>
        <CardTitle>{value ?? "Nothing selected"}</CardTitle>
        <CardDescription>
          Tree-form plugin demo for next-switch, explicit target, hidden-target fallback,
          and current-node switching from the Express deep leaf.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <CurrentNodeIdProvider value={deepNode?.id ?? ""}>
          <SwitchableActionButtons deepNodeId={deepNode?.id} />
        </CurrentNodeIdProvider>
      </CardContent>
    </Card>
  );
}

function SwitchableFromDeepNodeStory() {
  return (
    <SelectorProvider
      tree={switchableTree}
      defaultValue={SWITCHABLE_SYMBOLS.expressDeepLeaf}
    >
        <StorySceneGrid
          main={(
            <StoryTreeCard
              badge="Plugins"
              title="Switchable plugin tree"
              description="Delivery tree sample rendered with SelectorTree. Expand branches, select nodes, then trigger switchable runtime actions from the side panel."
            />
          )}
          aside={<SwitchableStoryPanel />}
        />
      </SelectorProvider>
    );
}

const meta = {
  title: "Plugins/Switchable",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Plugin capability stories focused on switchable branch behavior, shown as an interactive selector tree.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const SwitchableFromDeepNode: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Capability sample for switchable plugin runtime control in tree form. This story demonstrates four behaviors: switchFromNode(deepNodeId) advances to the next selectable switchable option, switchFromNode(deepNodeId, 'Standard') targets the Standard option, switchFromNode(deepNodeId, 'Hidden option') falls back when the requested target is hidden, and switchFromCurrentNode() advances from the current-node scope. See README section \"Runtime Control with `useSwitchable`\" for API details and mapping.",
      },
    },
  },
  render: () => <SwitchableFromDeepNodeStory />,
};
