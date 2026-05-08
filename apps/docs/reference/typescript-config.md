# TypeScript Config

Package: `@repo/typescript-config`

## Available configs

| File | Use case |
|---|---|
| `base.json` | Any TypeScript project |
| `vite.json` | Vite apps |
| `react-library.json` | React component libraries |
| `nextjs.json` | Next.js apps |

## Usage

```json
{
  "extends": "@repo/typescript-config/vite",
  "compilerOptions": {
    "outDir": "dist"
  }
}
```
