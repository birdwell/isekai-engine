# AGENTS.md

## Commands
- `npm run dev` - Start development server (Vite)
- `npm run build` - Production build
- `npx tsc --noEmit` - Typecheck only
- `npm test` - Run tests with Vitest (watch mode)
- `npm test -- --run` - Run tests once
- `npm run test:coverage` - Run tests with coverage report

## Architecture
React 19 + Vite + TypeScript app. An AI-powered text adventure game using Google Gemini APIs.
- `App.tsx` - Main component, orchestrates game state and media engine
- `components/` - React components (ActionPanel, NarrativeDisplay, StatusPanel, Visualizer, SettingsModal)
- `hooks/` - Custom hooks: `useGameState` (game logic), `useMediaEngine` (image/video generation)
- `services/geminiService.ts` - Gemini API calls (text, image, video, TTS generation)
- `types.ts` - Shared TypeScript interfaces (GameStatus, GameResponse, Choice, etc.)

## Code Style
- Functional React components with TypeScript (`React.FC<Props>`)
- Named exports for components/hooks; default export only for App
- Imports: React first, then components, hooks, services, types, icons (lucide-react)
- Use `@/*` path alias for imports (configured in tsconfig)
- Tailwind CSS for styling (utility classes inline)
- Async/await with try-catch for API calls; log errors with `console.error`
- Interface names: PascalCase (e.g., `GameStatus`, `ActionPanelProps`)
