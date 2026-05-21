# Configuration

## Environment variables

**`apps/api/.env`**

| Variable       | Description                                 |
| -------------- | ------------------------------------------- |
| `DATABASE_URL` | Postgres connection string                  |
| `API_PORT`     | Port for the Elysia server (default `3000`) |

**`apps/web` (Vite env)**

| Variable           | Description                                                         |
| ------------------ | ------------------------------------------------------------------- |
| `VITE_TARGET`      | Build target: `web` (default) or `electron`                         |
| `VITE_BACKEND_URL` | API base URL in web dev mode (defaults to `window.location.origin`) |

## Turborepo tasks

Tasks are defined in `turbo.json`:

| Task          | Command               | Description                    |
| ------------- | --------------------- | ------------------------------ |
| `dev`         | `bun dev`             | Start all apps in watch mode   |
| `build`       | `bun run build`       | Build all apps                 |
| `lint`        | `bun run lint`        | Run ESLint across the monorepo |
| `check-types` | `bun run check-types` | TypeScript type checking       |

Run a single app with `--filter`:

```sh
bun run build --filter=@basalt/backend
```

## TypeScript

Shared configs live in `packages/typescript-config`. Available presets:

| File                 | Use case                  |
| -------------------- | ------------------------- |
| `base.json`          | Any TypeScript project    |
| `vite.json`          | Vite apps                 |
| `react-library.json` | React component libraries |

```json
{ "extends": "@repo/typescript-config/vite" }
```

## ESLint

Shared configs live in `packages/eslint-config`:

| Export             | Use case                       |
| ------------------ | ------------------------------ |
| `./base`           | Base TypeScript rules          |
| `./react-app`      | React apps (Vite/React Router) |
| `./react-internal` | Internal React packages        |

```js
// eslint.config.mjs
import reactApp from "@repo/eslint-config/react-app";
export default [...reactApp];
```
