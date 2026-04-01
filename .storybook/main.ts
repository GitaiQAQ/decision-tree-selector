import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";

function normalizeBasePath(value: string | undefined): string {
  if (!value || value === "/") {
    return "/";
  }

  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}

function resolveStorybookBasePath(): string {
  if (process.env.STORYBOOK_BASE_PATH) {
    return normalizeBasePath(process.env.STORYBOOK_BASE_PATH);
  }

  const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
  if (process.env.GITHUB_ACTIONS === "true" && repositoryName) {
    return normalizeBasePath(repositoryName);
  }

  return "/";
}

const config: StorybookConfig = {
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs"],
  viteFinal: async (config) =>
    mergeConfig(config, {
      base: resolveStorybookBasePath(),
    }),
};

export default config;
