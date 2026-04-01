import { useState, type ComponentProps, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  SelectorProvider,
  dsl,
  useCurrentNodeId,
  useCurrentRadio,
  useNode,
  type NodeConfig,
  type SelectorSymbol,
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
import {
  JsonDebugCard,
  SelectorStoryScene,
  StoryIntroCard,
  StorySceneGrid,
  StoryTreeCard,
} from "./storybook-utils";
import { applyTreeVisuals } from "./tree-visuals";

const ecommerceTree = (() => {
  const tree = applyTreeVisuals(dsl.group(
    {
      renderLabel: "E-commerce catalog selector",
      renderDescription:
        "Select a department, drill into categories, then choose concrete SKUs and package options.",
    },
    [
      dsl.node(
          "Electronics",
          {
            renderLabel: "Electronics",
            renderDescription: "Phones, laptops, and accessories.",
          },
          [
            dsl.node(
                "Phones",
                {
                  renderLabel: "Phones",
                  renderDescription: "Choose a phone family first.",
                },
                [
                  dsl.node(
                      "iPhone",
                      {
                        renderLabel: "iPhone",
                        renderDescription: "Premium phone line.",
                      },
                      [
                        dsl.mutexGroup({}, [
                          dsl.optionMutex("iPhone 15 128GB", {
                            renderLabel: "iPhone 15 128GB",
                            renderDescription: "Starter storage option.",
                          }),
                          dsl.optionMutex("iPhone 15 256GB", {
                            renderLabel: "iPhone 15 256GB",
                            renderDescription: "Higher storage option in same mutex group.",
                          }),
                        ]),
                      ],
                    ),
                  dsl.node(
                      "Android",
                      {
                        renderLabel: "Android",
                        renderDescription: "Open ecosystem models.",
                      },
                      [
                        dsl.node("Pixel 8", {
                          renderLabel: "Pixel 8",
                          renderDescription: "Google flagship baseline.",
                        }),
                        dsl.node("Galaxy S24", {
                          renderLabel: "Galaxy S24",
                          renderDescription: "Samsung flagship baseline.",
                        }),
                      ],
                    ),
                  dsl.optionPanel("Phone Accessories", {
                    renderLabel: "Phone Accessories",
                    renderDescription:
                      "Panel branch shown when selection is inside Phones.",
                  }),
                ],
              ),
            dsl.node(
                "Laptops",
                {
                  renderLabel: "Laptops",
                  renderDescription: "Portable productivity devices.",
                },
                [
                  dsl.node("Ultrabook", {
                    renderLabel: "Ultrabook",
                    renderDescription: "Lightweight performance profile.",
                  }),
                  dsl.node("Gaming Laptop", {
                    renderLabel: "Gaming Laptop",
                    renderDescription: "High-GPU profile.",
                  }),
                ],
              ),
          ],
        ),
      dsl.node(
          "Home",
          {
            renderLabel: "Home",
            renderDescription: "Kitchen and appliance categories.",
          },
          [
            dsl.node("Kitchen", {
              renderLabel: "Kitchen",
              renderDescription: "Cookware and prep devices.",
            }),
          ],
        ),
    ],
  ));
  return tree;
})();

const permissionsTree = (() => {
  const tree = applyTreeVisuals(dsl.group(
    {
      renderLabel: "Permission policy tree",
      renderDescription:
        "Map organization access from workspace scope down to concrete permission policies.",
    },
    [
      dsl.node(
          "Workspace",
          {
            renderLabel: "Workspace",
            renderDescription: "Select where permissions are applied.",
          },
          [
            dsl.node(
                "Billing",
                {
                  renderLabel: "Billing",
                  renderDescription: "Billing domain permissions.",
                },
                [
                  dsl.mutexGroup({}, [
                    dsl.optionMutex("Billing Full Access", {
                      renderLabel: "Full access",
                      renderDescription:
                        "Single role selection that disables granular siblings.",
                    }),
                    dsl.optionMutex("Billing Custom Access", {
                      renderLabel: "Custom access",
                      renderDescription: "Enable granular scopes instead of full access.",
                    }),
                  ]),
                  dsl.optionPanel("Billing Advanced Scopes", {
                    renderLabel: "Advanced scopes",
                    renderDescription:
                      "Shown only when the current path is under Billing.",
                  }),
                ],
              ),
            dsl.node(
                "Analytics",
                {
                  renderLabel: "Analytics",
                  renderDescription: "View and export policy options.",
                },
                [
                  dsl.node("View dashboards", {
                    renderLabel: "View dashboards",
                  }),
                  dsl.node("Export reports", {
                    renderLabel: "Export reports",
                  }),
                ],
              ),
          ],
        ),
    ],
  ));
  return tree;
})();

type CustomItemProps = ComponentProps<
  NonNullable<NodeConfig["CustomItemRender"]>
>;
type CustomWrapperProps = ComponentProps<
  NonNullable<NodeConfig["CustomWrapperRender"]>
>;
type CustomChildrenProps = ComponentProps<
  NonNullable<NodeConfig["CustomChildrenRender"]>
>;

function asDisplayText(value: unknown, fallback: string): ReactNode {
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }
  return fallback;
}

function PermissionWrapper({ children, level }: CustomWrapperProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-3",
        { "border-primary/30": level === 0 },
      )}
    >
      {children}
    </div>
  );
}

function PermissionItem({ level }: CustomItemProps) {
  const currentNodeId = useCurrentNodeId();
  const node = useNode(currentNodeId);
  const { symbol, isSelected, disabled, hidden, onOptionClick } = useCurrentRadio();

  if (hidden) {
    return null;
  }

  const label = asDisplayText(node?.props.renderLabel, symbol ?? "Unnamed");
  const description = asDisplayText(node?.props.renderDescription, "");

  return (
    <Button
      variant={isSelected ? "default" : "outline"}
      className="h-auto w-full flex-col items-start py-2 text-left"
      disabled={Boolean(disabled)}
      onClick={onOptionClick}
    >
      <span className="mb-1">
        <Badge variant="secondary">Level {level}</Badge>
      </span>
      <span className="font-semibold leading-5">{label}</span>
      {description !== "" && (
        <span className="text-xs font-normal text-muted-foreground">
          {description}
        </span>
      )}
    </Button>
  );
}

function PermissionChildren({ children }: CustomChildrenProps) {
  const { hidden } = useCurrentRadio();

  if (hidden) {
    return null;
  }

  return <div className="mt-3 grid gap-3">{children()}</div>;
}

const permissionRendererConfig = {
  CustomWrapperRender: PermissionWrapper,
  CustomItemRender: PermissionItem,
  CustomChildrenRender: PermissionChildren,
} satisfies Pick<
  NodeConfig,
  "CustomWrapperRender" | "CustomItemRender" | "CustomChildrenRender"
>;

const permissionsTreeWithCustomRenderer = dsl.group(
  {
    ...permissionRendererConfig,
    renderLabel: "Permission renderer override",
  },
  [
    dsl.node(
      "Org Access",
      {
        ...permissionRendererConfig,
        renderLabel: "Org Access",
      },
      [
        dsl.node("Project Admin", {
          ...permissionRendererConfig,
          renderLabel: "Project Admin",
          renderDescription: "Manage billing and infrastructure settings.",
        }),
        dsl.node("Read Only", {
          ...permissionRendererConfig,
          renderLabel: "Read Only",
          renderDescription: "View resources without mutation permissions.",
        }),
      ],
    ),
  ],
);

function ControlledPermissionsStory() {
  const [value, setValue] = useState<SelectorSymbol | undefined>(
    "Billing Full Access",
  );
  const [previousValue, setPreviousValue] = useState<SelectorSymbol | undefined>();

  const options: SelectorSymbol[] = [
    "Billing Full Access",
    "Billing Custom Access",
    "View dashboards",
    "Export reports",
  ];

  return (
    <div className="grid gap-4">
      <StoryIntroCard
        title="Permissions tree in controlled mode"
        description="External state owns the selected permission symbol. Use buttons below to switch active nodes."
      >
        {options.map((option) => (
          <Button
            key={option}
            variant={value === option ? "default" : "outline"}
            size="sm"
            onClick={() => setValue(option)}
          >
            {option}
          </Button>
        ))}
      </StoryIntroCard>

      <SelectorProvider
        tree={permissionsTree}
        value={value}
        onValueChange={(nextValue, lastValue) => {
          setPreviousValue(lastValue);
          setValue(nextValue);
        }}
      >
        <StorySceneGrid
          main={<StoryTreeCard />}
          aside={(
            <JsonDebugCard
              badge="External state"
              title={value ?? "Nothing selected"}
              description={`Previous callback value: ${previousValue ?? "none"}`}
              data={{ value, previousValue }}
            />
          )}
        />
      </SelectorProvider>
    </div>
  );
}

const meta = {
  title: "Runtime/Real-World Trees",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Real-world runtime stories built around an e-commerce catalog tree and a permission policy tree.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const EcommerceCatalogTree: Story = {
  render: () => (
    <SelectorStoryScene
      tree={ecommerceTree}
      title="E-commerce catalog tree"
      description="Department → category → product family → concrete SKU. Includes panel and mutex behavior in realistic catalog flows."
    />
  ),
};

export const PermissionsPolicyTree: Story = {
  render: () => (
    <SelectorStoryScene
      tree={permissionsTree}
      title="Permission policy tree"
      description="Workspace → module → policy option with mutually exclusive permission strategies and hidden advanced scopes."
    />
  ),
};

export const PermissionsControlledMode: Story = {
  render: () => <ControlledPermissionsStory />,
};

export const PermissionsRendererOverride: Story = {
  render: () => (
    <SelectorStoryScene
      tree={permissionsTreeWithCustomRenderer}
      title="Permission tree with renderer override"
      description="Demonstrates custom wrapper/item/children renderers with shadcn primitives instead of hand-crafted inline styles."
      autoSelectDefault={false}
    />
  ),
};
