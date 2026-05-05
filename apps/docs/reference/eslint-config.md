# ESLint Config

Package: `@repo/eslint-config`

## Exports

| Export | Description |
|---|---|
| `./base` | Base rules for all TypeScript projects |
| `./next-js` | Next.js specific rules |
| `./react-internal` | Rules for internal React packages |

## Usage

```js
// eslint.config.mjs
import { base } from '@repo/eslint-config/base'

export default [...base]
```
