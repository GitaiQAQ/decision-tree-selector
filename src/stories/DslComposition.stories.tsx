import type { Meta, StoryObj } from "@storybook/react-vite";

import { DslExamplesPage, compositionExamples } from "./dsl-examples-shared";

const meta = {
  title: "DSL/Composition",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Concrete runtime composition demos showing how the exported DSL atoms combine into realistic selector flows.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Showcase: Story = {
  render: () => (
    <DslExamplesPage
      badge="Runtime DSL compositions"
      title="DSL composition cases"
      description="These examples show how the atomic helpers combine into realistic selector patterns used in checkout, permissions, routing, and catalog flows."
      examples={compositionExamples}
    />
  ),
};
