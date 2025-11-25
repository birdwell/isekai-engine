# Hooks

Custom React hooks for game state and media management.

## Available Hooks

| Hook | Purpose |
|------|---------|
| `useGameAgent` | Core game logic: agent-based turns, save/load, quest integration |
| `useMediaEngine` | Image/video gallery: generation, navigation, auto-paint |
| `useAudioPlayer` | Text-to-speech: play/stop narrative audio |
| `useQuestSystem` | Quest tracking: objectives, progress, completion |

## Hook Patterns

### State Management
- Use `useState` for reactive state
- Use `useRef` for values that shouldn't trigger re-renders (timers, galleries)
- Use `useCallback` for stable function references passed to children

### Side Effects
- `useEffect` for initialization, cleanup, and subscriptions
- Always include cleanup functions for timers/subscriptions
- Dependency arrays must be complete

### API Integration
- Async operations in `useCallback` with try/catch
- Loading states for async operations
- Error logging with `console.error`

## Testing

- Use `@testing-library/react`'s `renderHook` and `act`
- Mock external services (`@/services/gemini`)
- Mock browser APIs (`localStorage`, `AudioContext`)
- Test file naming: `useHookName.test.ts`

## Dependencies

```
useGameAgent
├── GameMasterAgent (agent service)
└── GameMemory (save/load state)

useMediaEngine
├── generateSceneImage (Gemini API)
└── generateSceneVideo (Gemini API)

useAudioPlayer
├── generateSpeech (Gemini API)
└── utils/audio (decoding)
```
