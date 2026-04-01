import type { Meta, StoryObj } from "@storybook/react-vite";

import { DslExamplesPage, atomicExamples } from "./dsl-examples-shared";

const meta = {
  title: "Runtime/DSL Examples/Atoms",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Concrete runtime demos for every exported DSL atom, each shown with a live tree, snippet, and runtime evidence.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Showcase: Story = {
  render: () => (
    <DslExamplesPage
      badge="Runtime DSL atoms"
      title="Atomic DSL capabilities"
      description="Every exported DSL helper is demonstrated here as a concrete runtime example with a live tree and runtime evidence panel."
      examples={atomicExamples}
    />
  ),
};
