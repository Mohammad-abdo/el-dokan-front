# The AI-Native shadcn/ui Component Library for React

This dashboard uses **[shadcn/ui](https://ui.shadcn.com/)** (the AI-Native component library for React): copy-paste components built with **Radix UI** and **Tailwind CSS**, designed for AI-assisted development and full code ownership.

## Resources

- **Docs:** [ui.shadcn.com/docs](https://ui.shadcn.com/docs)
- **Components:** [ui.shadcn.com/docs/components](https://ui.shadcn.com/docs/components)
- **Registry:** [ui.shadcn.com/docs/registry](https://ui.shadcn.com/docs/registry)
- **CLI:** [ui.shadcn.com/docs/cli](https://ui.shadcn.com/docs/cli)
- **JavaScript:** [ui.shadcn.com/docs/javascript](https://ui.shadcn.com/docs/javascript) (this project uses JSX, `tsx: false` in `components.json`)

## Project setup

- **Config:** `components.json` (style: `new-york`, `tsx: false` for `.jsx` files)
- **Path alias:** `@/` → `./src/` (see `vite.config.js` and `jsconfig.json`)
- **Utils:** `@/lib/utils` → `cn()` (clsx + tailwind-merge)
- **UI folder:** `src/components/ui/` – all shadcn components live here

## Installed components

| Component       | File               | Usage |
|----------------|--------------------|--------|
| Button         | `ui/button.jsx`    | `import { Button } from "@/components/ui/button"` |
| Card           | `ui/card.jsx`      | Card, CardHeader, CardTitle, CardContent, CardFooter |
| Dialog         | `ui/dialog.jsx`    | Modal dialogs |
| Input          | `ui/input.jsx`     | Form input |
| Label          | `ui/label.jsx`     | Form label |
| Badge          | `ui/badge.jsx`     | Status badges |
| Progress       | `ui/progress.jsx`  | Progress bar |
| Select         | `ui/select.jsx`    | Dropdown select |
| Table          | `ui/table.jsx`     | Data tables |
| Tabs           | `ui/tabs.jsx`      | Tab panels |
| Textarea       | `ui/textarea.jsx`  | Multi-line input |
| **Skeleton**   | `ui/skeleton.jsx`  | Loading placeholder |
| **Separator**  | `ui/separator.jsx`| Divider line |
| **Scroll Area**| `ui/scroll-area.jsx` | Scrollable container |
| **Avatar**     | `ui/avatar.jsx`   | User avatar (Avatar, AvatarImage, AvatarFallback) |
| **Dropdown Menu** | `ui/dropdown-menu.jsx` | DropdownMenu, Trigger, Content, Item, Separator, etc. |
| **Sheet**      | `ui/sheet.jsx`     | Slide-out panel (Sheet, SheetTrigger, SheetContent, SheetHeader, etc.) |

## Adding more components

From the project root (`dashbaord`):

```bash
npx shadcn@latest add <component-name>
```

Examples:

```bash
npx shadcn@latest add tooltip
npx shadcn@latest add alert
npx shadcn@latest add sonner
```

The CLI uses `components.json` and `jsconfig.json` and will add **JavaScript (`.jsx`)** files because `tsx` is set to `false`.

## Theming

Theme variables are in `src/index.css` under `@layer base`:

- `--background`, `--foreground`, `--card`, `--primary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`
- Dark mode: `.dark { ... }`

To change the base color or style, either edit these variables or run:

```bash
npx shadcn@latest init
```

and choose a different base color (e.g. zinc, slate).

## RTL and i18n

The app supports RTL (Arabic). Layout uses `dir={isRTL ? "rtl" : "ltr"}`. shadcn/ui works with RTL; use logical properties and the same components.

---

**Summary:** This project uses the official **AI-Native shadcn/ui** component library for React. All UI primitives are in `src/components/ui/` and can be extended via the shadcn CLI or by copying new components from the [registry](https://ui.shadcn.com/docs/registry).
