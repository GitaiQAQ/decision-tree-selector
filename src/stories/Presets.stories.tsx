import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  BasicTreeNode,
  BasicTreeNodeGroup,
  BasicTreeNodeWrapper,
  PortalSplitPresetFrame,
  PortalSplitTreeNode,
  PortalSplitTreeNodeGroup,
  PortalSplitTreeNodeWrapper,
  SelectorProvider,
  SelectorTree,
  SpotlightTreeNode,
  SpotlightTreeNodeGroup,
  SpotlightTreeNodeWrapper,
  dsl,
  type RuntimeNode,
  type SelectorSymbol,
} from "../index";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { JsonDebugCard, StoryIntroCard } from "./storybook-utils";

type PresetRenderers = Pick<
  RuntimeNode,
  "CustomItemRender" | "CustomChildrenRender" | "CustomWrapperRender"
>;

const basicPresetRenderers: PresetRenderers = {
  CustomItemRender: BasicTreeNode,
  CustomChildrenRender: BasicTreeNodeGroup,
  CustomWrapperRender: BasicTreeNodeWrapper,
};

const spotlightPresetRenderers: PresetRenderers = {
  CustomItemRender: SpotlightTreeNode,
  CustomChildrenRender: SpotlightTreeNodeGroup,
  CustomWrapperRender: SpotlightTreeNodeWrapper,
};

const portalSplitPresetRenderers: PresetRenderers = {
  CustomItemRender: PortalSplitTreeNode,
  CustomChildrenRender: PortalSplitTreeNodeGroup,
  CustomWrapperRender: PortalSplitTreeNodeWrapper,
};

function withPreset(node: RuntimeNode, preset: PresetRenderers): RuntimeNode {
  return {
    ...node,
    CustomItemRender: node.CustomItemRender ?? preset.CustomItemRender,
    CustomChildrenRender: node.CustomChildrenRender ?? preset.CustomChildrenRender,
    CustomWrapperRender: node.CustomWrapperRender ?? preset.CustomWrapperRender,
    children: node.children.map((child) => withPreset(child, preset)),
  };
}

function createPresetDemoTree(): RuntimeNode {
  return dsl.group(
    {
      renderLabel: "Checkout decision tree",
      renderDescription: "A small tree used to compare visual presets.",
    },
    [
      dsl.node(
        "Shipping",
        {
          renderLabel: "Shipping",
          renderDescription: "Choose delivery speed and fulfillment path.",
        },
        [
          dsl.node("Standard", {
            renderLabel: "Standard",
            renderDescription: "3-5 days, lower cost.",
          }),
          dsl.node("Express", {
            renderLabel: "Express",
            renderDescription: "1-2 days, priority handling.",
          }),
        ],
      ),
      dsl.node(
        "Protection Plan",
        {
          renderLabel: "Protection Plan",
          renderDescription: "Select optional warranty coverage.",
        },
        [
          dsl.optionMutex("No plan", {
            renderLabel: "No plan",
          }),
          dsl.optionMutex("One-year plan", {
            renderLabel: "One-year plan",
          }),
        ],
      ),
    ],
  );
}

function PresetTreeCard({
  title,
  description,
  tree,
  value,
  onValueChange,
}: {
  title: string;
  description: string;
  tree: RuntimeNode;
  value?: SelectorSymbol;
  onValueChange: (nextValue: SelectorSymbol | undefined) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          Preset
        </Badge>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <SelectorProvider tree={tree} value={value} onValueChange={onValueChange}>
          <SelectorTree />
        </SelectorProvider>
      </CardContent>
    </Card>
  );
}

function PresetComparisonStory() {
  const [value, setValue] = useState<SelectorSymbol | undefined>("Express");

  const basicTree = useMemo(
    () => withPreset(createPresetDemoTree(), basicPresetRenderers),
    [],
  );
  const spotlightTree = useMemo(
    () => withPreset(createPresetDemoTree(), spotlightPresetRenderers),
    [],
  );

  return (
    <div className="grid gap-4">
      <StoryIntroCard
        badge="Preset Showcase"
        title="Compare visual presets on the same runtime tree"
        description="Both panels share the same selected symbol, so selection behavior stays identical while visual language changes by preset."
      />

      <div className="grid max-w-6xl items-start gap-6 lg:grid-cols-[minmax(300px,1fr)_minmax(300px,1fr)_minmax(280px,360px)]">
        <PresetTreeCard
          title="Basic preset"
          description="Current baseline renderer exported by the library."
          tree={basicTree}
          value={value}
          onValueChange={setValue}
        />

        <PresetTreeCard
          title="Spotlight preset"
          description="Alternative presentation emphasizing hierarchy and selection focus."
          tree={spotlightTree}
          value={value}
          onValueChange={setValue}
        />

        <JsonDebugCard
          badge="Shared State"
          title={value ?? "Nothing selected"}
          description="A single controlled value drives both preset trees."
          data={{ selectedValue: value }}
          dataLabel="Selection payload"
        />
      </div>
    </div>
  );
}

function PortalSplitTreeCard({
  tree,
  value,
  onValueChange,
}: {
  tree: RuntimeNode;
  value?: SelectorSymbol;
  onValueChange: (nextValue: SelectorSymbol | undefined) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          Portal preset
        </Badge>
        <CardTitle>Portal split preset</CardTitle>
        <CardDescription>
          Top-level branches are rendered into a left rail, while the active branch is projected into a right detail column through React Portal.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <SelectorProvider tree={tree} value={value} onValueChange={onValueChange}>
          <PortalSplitPresetFrame
            navigationTitle="Product decisions"
            navigationDescription="Each top-level branch is navigable from the left rail."
            detailTitle="Configuration workspace"
            detailDescription="The selected branch subtree is rendered into this panel."
            emptyDetailTitle="Select a decision branch"
            emptyDetailDescription="Start from the left rail to inspect shipping or protection plan options."
          >
            <SelectorTree />
          </PortalSplitPresetFrame>
        </SelectorProvider>
      </CardContent>
    </Card>
  );
}

function PortalSplitPresetStory() {
  const [value, setValue] = useState<SelectorSymbol | undefined>("Express");

  const portalTree = useMemo(
    () => withPreset(createPresetDemoTree(), portalSplitPresetRenderers),
    [],
  );

  return (
    <div className="grid gap-4">
      <StoryIntroCard
        badge="Portal Showcase"
        title="React Portal driven preset with split navigation and detail panes"
        description="This preset turns top-level branches into a left navigation rail and portals the active branch subtree into a dedicated right workspace. Selection semantics still come from the same runtime tree."
      />

      <div className="grid max-w-6xl items-start gap-6 lg:grid-cols-[minmax(720px,1fr)_minmax(280px,340px)]">
        <PortalSplitTreeCard tree={portalTree} value={value} onValueChange={setValue} />

        <JsonDebugCard
          badge="Shared State"
          title={value ?? "Nothing selected"}
          description="Portal projection changes layout only. The underlying controlled value remains the same selector symbol."
          data={{ selectedValue: value }}
          dataLabel="Selection payload"
        />
      </div>
    </div>
  );
}

const meta = {
  title: "Runtime/Presets",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Preset-focused stories that show how different renderer sets can sit on top of the same selector runtime behavior, including a React Portal driven split-layout preset.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const BasicVsSpotlight: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Renders the same DSL tree twice with two presets: Basic and Spotlight. Clicking nodes in either panel updates a shared controlled value, proving that presets only change visualization, not selection semantics.",
      },
    },
  },
  render: () => <PresetComparisonStory />,
};

export const PortalSplitWorkspace: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Renders the same DSL tree with a preset that uses React Portal to move top-level branch navigation into a left rail and the active branch subtree into a right workspace panel.",
      },
    },
  },
  render: () => <PortalSplitPresetStory />,
};
