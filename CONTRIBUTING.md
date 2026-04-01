# Contributing

Thanks for your interest in contributing to `decision-tree-selector`.

This project is still an early extraction of a reusable selector runtime. The goal of contributions is to keep the public surface generic, well-typed, and free of product-specific assumptions.

## Before you start

- Read the README to understand the current scope.
- Prefer small, focused pull requests.
- Open an issue before large feature work so we can align on scope.
- Avoid mixing refactors with behavior changes unless the refactor is required for the fix.

## Local development

This repository currently uses `pnpm` as its package manager.

```bash
pnpm install
npm run dev
```

Useful scripts:

- `npm run dev` — start the demo app
- `npm run test` — run the test suite
- `npm run build` — typecheck, build the library, and build the demo app
- `npm run typecheck` — run TypeScript without emitting files

## Pull request guidelines

Please try to keep each pull request easy to review:

1. Describe the problem and the intended outcome.
2. Add or update tests when behavior changes.
3. Keep public API changes explicit in the PR description.
4. Update README or inline docs when usage changes.
5. Make sure `npm run test` and `npm run build` pass locally.

## Scope guidelines

Good fits for this repository:

- generic selector tree behavior
- runtime pipeline improvements
- React provider and hook ergonomics
- renderer customization improvements
- demo improvements that clarify public behavior
- docs and test coverage improvements

Out of scope unless discussed first:

- product-specific entities or SDK wrappers
- business-only feature gates
- host-app integrations tied to a private environment

## Reporting bugs

When filing a bug, include:

- what you expected to happen
- what actually happened
- steps to reproduce
- a minimal tree or DSL snippet if relevant
- screenshots or snapshots when UI behavior is involved

## Code style

- Match the existing TypeScript and React style in the repository.
- Keep types precise.
- Prefer minimal changes over broad rewrites.
- Do not add generated build output manually.

## Questions

Use GitHub Issues for bugs and feature requests. If a request is really a usage question, add enough context for maintainers to reproduce the scenario.
