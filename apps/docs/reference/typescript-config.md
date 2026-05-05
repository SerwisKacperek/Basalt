# TypeScript Config

Package: `@repo/typescript-config`

## Available Configs

| File | Use case |
|---|---|
| `base.json` | Any TypeScript project |
| `nextjs.json` | Next.js apps |
| `react-library.json` | React component libraries |

## Usage

```json
{
  "extends": "@repo/typescript-config/base",
  "compilerOptions": {
    "outDir": "dist"
  }
}
```
