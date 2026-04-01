import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function OverviewPage() {
  return (
    <div className="grid max-w-5xl gap-4">
      <Card>
        <CardHeader>
          <Badge className="w-fit" variant="secondary">
            Overview
          </Badge>
          <CardTitle>decision-tree-selector</CardTitle>
          <CardDescription>
            Tree-based runtime for branching selectors in React.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            <code>decision-tree-selector</code> is a React runtime for tree-based
            selection flows. It is built for interfaces where one choice changes
            which branches are visible, disabled, or selected by default.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What it gives you</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>a DSL for describing selector trees</li>
            <li>runtime bootstrap and default-selection behavior</li>
            <li>React providers and hooks for selection state</li>
            <li>a minimal built-in renderer surface</li>
            <li>debug snapshots for understanding runtime output</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Storybook scenario set</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            The Storybook examples are organized around realistic trees plus focused plugin demos:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Runtime/DSL Examples/Atoms</strong> — concrete live demos for
              every exported DSL helper.
            </li>
            <li>
              <strong>Runtime/DSL Examples/Composition</strong> — realistic selector
              flows built from those DSL atoms.
            </li>
            <li>
              <strong>E-commerce catalog tree</strong> for category-to-SKU
              decision paths with expand/collapse navigation.
            </li>
            <li>
              <strong>Permission policy tree</strong> for workspace/module access
              strategy selection.
            </li>
            <li>
              <strong>Node states demo</strong> — live demonstration of disabled,
              hidden, and forbidden predicates with badges and expand/collapse.
            </li>
            <li>
              <strong>Async predicate resolve</strong> — click to trigger async
              authorization flow that re-enables locked nodes.
            </li>
            <li>
              <strong>Switchable plugin tree</strong> — plugin capability sample moved
              under Plugins, still rendered as an interactive selector tree.
            </li>
          </ul>
          <p>
            These scenarios make hierarchy depth and branch behavior easier to
            read than abstract demo labels.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current repository status</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            This Storybook reflects the repository as it exists today: an early
            open-source library with typed runtime APIs, realistic demo trees,
            proper tree-line visuals (indent, connectors, expand/collapse), and
            customization examples including disabled, hidden, forbidden, and
            async predicate demos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

const meta = {
  title: "Overview",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "High-level introduction to the decision-tree-selector library and how the Storybook examples are organized.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => <OverviewPage />,
};
