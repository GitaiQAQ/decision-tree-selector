# decision-tree-selector

`decision-tree-selector` is a lightweight React library for building and managing complex selection UIs that behave like a **decision tree**.

![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-149ECA?logo=react&logoColor=white)
![Storybook](https://img.shields.io/badge/Storybook-docs%20included-FF4785?logo=storybook&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

[Live Storybook](https://gitaiqaq.github.io/decision-tree-selector/) · [Documentation site](#documentation-site) · [Quick start](#quick-start) · [Example API](#example-api-usage) · [Contributing](./CONTRIBUTING.md) · [Security](./SECURITY.md) · [Issues](https://github.com/GitaiQAQ/decision-tree-selector/issues)

It is currently an early `0.x` open-source cut focused on the selector core rather than product-specific integrations.

## Why this project exists

This library is for selection UIs that behave more like a **decision tree** than a flat form.

Use it when:

- one choice changes which branches are visible
- some options are disabled by runtime rules
- the runtime should resolve a default selection path
- you want to keep tree logic separate from rendering

Typical examples include campaign selectors, configuration flows, guided pickers, and multi-branch option panels.

## What is included

- generic DSL node creation
- runtime bootstrap pipeline and default selection behavior
- generic React providers and hooks
- a minimal built-in renderer surface
- one demo preset and one demo config tree
- debug helpers for runtime snapshots and path inspection

## What is intentionally excluded

- campaign-specific entities and SDK types
- feature-gating and creation-query semantics
- tracking, dialogs, and host-specific wrappers
- heavy product preset trees
- other business-only branching logic

## Project status

This repository is under active extraction and cleanup.

- The public API is becoming more stable, but it is still early-stage.
- The package is not positioned here as a published registry package yet.
- The demo app is the main way to inspect current behavior.
- Storybook is available as the main component/docs site for usage examples.

## Repository layout

- `src/index.ts` — public API exports
- `src/selector/` — core runtime, hooks, plugins, and renderer pieces
- `src/selector/presets/basic/` — minimal preset components
- `src/selector/demo/` — demo tree used by the sample app
- `src/stories/` — Storybook docs and interactive usage examples
- `src/App.tsx` — demo application

## Documentation site

This repository includes a Storybook-powered docs site for interactive examples.

- Hosted Storybook: https://gitaiqaq.github.io/decision-tree-selector/
- Repository: https://github.com/GitaiQAQ/decision-tree-selector

### Choose your entry point

- **Use the demo app** when you want to inspect the current bundled example end-to-end.
- **Use Storybook** when you want focused docs, isolated examples, and API-oriented usage scenarios.

Run it locally:

```bash
npm run storybook
```

Build the static docs site:

```bash
npm run build-storybook
```

For GitHub Pages project-site builds, Storybook reads an optional
`STORYBOOK_BASE_PATH` environment variable and rewrites asset URLs accordingly.
The included Pages workflow sets this automatically to `/<repo-name>/`.

The Storybook coverage currently includes:

- `DSL/Atoms` for every exported DSL helper
- `DSL/Composition` for realistic composition cases built from those helpers
- integrated runtime flows with `SelectorProvider` + `SelectorTree`
- default-selection behavior
- mutex and hidden-panel behavior
- controlled provider usage
- custom renderer override examples

Recommended Storybook learning path:

1. `Overview`
2. `Runtime/Real-World Trees`
3. `Runtime/Node State Behaviors`
4. `DSL/Atoms`
5. `DSL/Composition`
6. `Plugins/Switchable`

## Quick start

Install dependencies and choose the environment you want to explore:

```bash
pnpm install
```

- Demo app: `npm run dev`
- Storybook docs site: `npm run storybook`

If you are trying to understand the public API for the first time, Storybook is the better starting point. The `Overview` page mirrors this reading order and links directly to the main runtime stories.

## Local development

This repository currently uses `pnpm`.

```bash
pnpm install
npm run dev
```

Open the Vite app to explore the demo tree and current runtime snapshot output.
Use `npm run storybook` when you want the component/docs site instead of the demo app.

## Scripts

- `npm run dev` — start the demo app
- `npm run storybook` — start the Storybook docs site
- `npm run test` — run unit tests
- `npm run build` — typecheck, bundle the library, and build the demo app
- `npm run build-storybook` — build the static Storybook site
- `npm run typecheck` — run TypeScript without emitting files

## Publishing Storybook to GitHub Pages

This repository includes `.github/workflows/deploy-storybook.yml` for GitHub Pages.

Expected setup:

1. In GitHub repository settings, set **Pages** source to **GitHub Actions**.
2. Push to `main`, or run the workflow manually from the Actions tab.
3. The workflow builds Storybook, uploads `storybook-static`, and deploys it to
   the Pages environment.

If you need to test the Pages asset path locally, build Storybook with a custom
base path:

```bash
STORYBOOK_BASE_PATH=/decision-tree-selector/ npm run build-storybook
```

## Example API usage

```tsx
import { SelectorProvider, SelectorTree, dsl } from "decision-tree-selector";

const tree = dsl.group({}, [
  dsl.node("Awareness", { renderLabel: "Awareness" }, [
    dsl.node("Reach", { renderLabel: "Reach" }),
    dsl.node("Traffic", { renderLabel: "Traffic" }),
  ]),
]);

export function Example() {
  return (
    <SelectorProvider tree={tree}>
      <SelectorTree />
    </SelectorProvider>
  );
}
```

For richer examples, see the Storybook stories under `src/stories/`, especially the integrated runtime, controlled usage, and custom renderer examples.

## Switchable as Plugin Capability

`switchable` is a reusable plugin capability for tree branches where sibling options can switch by intent instead of only by direct click order.

Use it when you need:

- next-option switching within the same switchable group
- switching triggered from a deep descendant node
- deterministic fallback when a requested target symbol is hidden or disabled

Terminology used in this guide:

- **plugin capability**: reusable runtime behavior attached through plugin metadata
- **switchable option**: a node participating in switch-based candidate resolution
- **target symbol**: the requested destination symbol when switching
- **fallback**: the path chosen when the target symbol is not selectable

## Quick Start: Enable Switchable

Enable the capability in DSL by defining a switchable group and switchable options.

```tsx
import { dsl } from "decision-tree-selector";

const tree = dsl.group({}, [
  dsl.switchableGroup({ renderLabel: "Plan" }, [
    dsl.switchableOption("Smart", { renderLabel: "Smart", default: true }, [
      dsl.node("SmartChild", { renderLabel: "Smart Child" }),
    ]),
    dsl.switchableOption("Standard", { renderLabel: "Standard" }),
    dsl.switchableOption("Lite", { renderLabel: "Lite" }),
  ]),
]);
```

Default resolution order for switchable options is:

1. option marked as `default`
2. first selectable switchable option
3. fallback path

> Quick Start covers structure and default resolution only. Runtime switching calls are in the next section.

## Runtime Control with `useSwitchable`

Use `useSwitchable` to trigger switch behavior from deep nodes or current selection context. For an interactive capability matrix in Storybook, see `SwitchableFromDeepNode` under `Plugins/Switchable` in `src/stories/Plugins.stories.tsx`.

```tsx
import { useSwitchable } from "decision-tree-selector";

function SwitchActions({ deepNodeId }: { deepNodeId: string }) {
  const {
    switchFromNode,
    switchFromCurrentNode,
  } = useSwitchable();

  return (
    <>
      <button onClick={() => switchFromNode(deepNodeId)}>
        Next from deep node
      </button>
      <button onClick={() => switchFromNode(deepNodeId, "Standard")}>
        Switch deep node to Standard
      </button>
      <button onClick={() => switchFromCurrentNode()}>
        Next from current node
      </button>
      <button onClick={() => switchFromCurrentNode("Standard")}>
        Switch current node to Standard
      </button>
    </>
  );
}
```

## How It Works (Lightweight)

At runtime, switchable behavior follows a small mental model:

1. filter selectable candidates from the nearest switchable option set
2. resolve target symbol when provided, otherwise resolve the next candidate
3. write selection back to the tree state

Behavior rules to keep in mind:

- if the target symbol is selectable, switch to that target symbol
- if the target symbol is not selectable (hidden/disabled/missing), use fallback
- if no target symbol is provided, resolve the next selectable option, then fallback when needed

## Minimal Custom Plugin Template

Use this template when you want to implement a small plugin capability with explicit metadata and a single runtime hook.

```ts
import { Meta, Plugin, PluginContext } from "decision-tree-selector";

export const minimalSwitchLikePlugin: Plugin = (ctx: PluginContext) => {
  const isTargetGroup = ctx.node.marks?.includes("custom.switch-group");
  if (!isTargetGroup) return;

  if (ctx.node.props[Meta.DEFAULT_ON]) return;

  ctx.node.props[Meta.DEFAULT_ON] = async (innerCtx: PluginContext) => {
    const children = innerCtx.node.children;
    const firstVisible = children.find((child) => child.props?.hidden == null);
    return firstVisible?.symbol;
  };
};
```

## From Sample to Your Plugin

1. Copy the template and rename marks to your domain policy.
2. Replace candidate filtering logic with your business constraints.
3. (Optional) expose a DSL helper that auto-attaches your plugin for easier reuse.

## Core concepts

- **DSL nodes** define the selector tree.
- **Bootstrap** converts runtime nodes into rendered tree state.
- **Plugins** can modify node behavior during bootstrap.
- **Providers and hooks** expose selection state and tree context to React.
- **Renderer components** provide a minimal built-in UI surface that can be customized.
- **Dependency tracking** uses Proxy-based runtime tracing for dynamic resolvers and predicates.

## Dependency tracking and adapters

Dynamic predicates and resolver functions are evaluated with a Proxy-based dependency tracker.

You can inspect traces through debug utilities and exported helpers:

- `getDependencyTrace(traceId)`
- `listDependencyTracesByPrefix(prefix)`
- `onDependencyTrace(listener)`

For ecosystems that still rely on MobX integration, the library exposes an optional MobX bridge adapter:

- `createMobxDependencyAdapter(mobxLike)`

This keeps the runtime tracking core framework-agnostic while allowing optional MobX-based trace subscription workflows. The adapter is a bridge for observed trace streams, not a full MobX runtime replacement.

## Testing and verification

Current automated checks cover core bootstrap and debug behavior.

```bash
npm run test
npm run build
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for local setup, scope guidelines, and pull request expectations.

## Security

Please report security issues according to [SECURITY.md](./SECURITY.md). Do not file public issues for suspected vulnerabilities.

## License

[MIT](./LICENSE)

## Migration notes

This repository does not copy the original `src/core/` wholesale. It keeps the generic runtime ideas while removing domain assumptions such as campaign entity enums, tracking side effects, and host-global wrappers.
