# Configuration

## Turbo

Pipeline configuration lives in `turbo.json` at the root. Tasks defined there run across all workspaces.

## TypeScript

Shared TypeScript configs are in `packages/typescript-config`. Extend them from any workspace:

```json
{
  "extends": "@repo/typescript-config/base"
}
```

## ESLint

Shared ESLint configs are in `packages/eslint-config`. Import presets for Next.js, React, or base usage.
