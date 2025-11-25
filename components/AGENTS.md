# Components

React components for the Isekai Engine UI.

## Structure

Each component has its own folder with:
- `index.tsx` - Main component export
- Sub-components as separate files (e.g., `ChoiceButton.tsx`)
- `ComponentName.test.tsx` - Tests (co-located or in folder)

## Component Categories

| Folder | Purpose |
|--------|---------|
| `ActionPanel/` | Player input: choice buttons, custom action text field |
| `AppHeader/` | Top bar: title, save/load/restart buttons, settings |
| `AuthScreen/` | API key input screen |
| `LoadingScreen/` | Initial loading state |
| `NarrativeDisplay/` | Story text, turn indicator, audio controls |
| `NotificationToast/` | Success/error toast notifications |
| `SettingsModal/` | Game settings (quality, auto-paint, audio) |
| `StatusPanel/` | Character stats, inventory, location, quests |
| `Visualizer/` | Scene image/video gallery with navigation |
| `ui/` | Shared primitives: `IconButton`, `LoadingSpinner` |

## Conventions

- Use `React.FC<Props>` with explicit interface
- Named exports only (e.g., `export const ActionPanel`)
- Props interface named `{ComponentName}Props`
- Tailwind CSS for all styling (no CSS files)
- Icons from `lucide-react`
- Use `@/` path alias for imports

## Example Structure

```
ComponentName/
├── index.tsx           # Main component
├── SubComponent.tsx    # Child components
└── ComponentName.test.tsx
```

## Testing

- Use `@testing-library/react` and `vitest`
- Test file naming: `ComponentName.test.tsx`
- Mock external dependencies (hooks, services)
- Test user interactions, not implementation details
