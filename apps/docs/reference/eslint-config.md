# ESLint Config

Package: `@repo/eslint-config`

## Exports

| Export | Use case |
|---|---|
| `./base` | Base TypeScript rules for any project |
| `./react-app` | React apps (Vite, React Router) |
| `./react-internal` | Internal React packages |
| `./next-js` | Next.js apps |

## Usage

```js
// eslint.config.mjs
import reactApp from '@repo/eslint-config/react-app'

export default [...reactApp]
```
