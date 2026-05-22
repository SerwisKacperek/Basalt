# @basalt/ui

Shared UI components and utilities for the Basalt project.

## Components

### Icon

A flexible icon component that uses [lucide-react](https://lucide.dev) icons.

#### Usage

```tsx
import { Icon } from "@basalt/ui";

// Basic usage
<Icon name="Heart" />

// With custom size
<Icon name="Heart" size={32} />

// With custom styling
<Icon name="Heart" className="text-red-500" />

// With stroke width
<Icon name="Heart" size={24} strokeWidth={1.5} />
```

#### Available Icons

All icons from [lucide-react](https://lucide.dev) are available. Just use the icon name as shown in their documentation.

#### Props

| Prop              | Type                 | Default | Description                                   |
| ----------------- | -------------------- | ------- | --------------------------------------------- |
| `name`            | `keyof typeof Icons` | -       | The name of the lucide icon to render         |
| `size`            | `number \| string`   | `24`    | Size of the icon in pixels                    |
| `strokeWidth`     | `number`             | `2`     | Stroke width of the icon paths                |
| `className`       | `string`             | -       | Additional CSS classes                        |
| Any SVG attribute | -                    | -       | Standard SVG element attributes are supported |

## Exports

- `./` - All components
- `./tailwind` - Tailwind preset
- `./styles` - Global CSS
- `./lib/utils` - Utility functions
