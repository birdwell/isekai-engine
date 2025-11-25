# Services

External API integrations and backend communication.

## Structure

```
services/
└── gemini/           # Google Gemini AI APIs
    ├── index.ts      # Re-exports all functions
    ├── client.ts     # GoogleGenAI client singleton
    ├── prompts.ts    # System prompts and art style constants
    ├── textGeneration.ts    # Adventure narrative
    ├── imageGeneration.ts   # Scene images
    ├── videoGeneration.ts   # Scene videos
    └── speechGeneration.ts  # Text-to-speech
```

## Gemini Service Functions

| Function | Model | Purpose |
|----------|-------|---------|
| `generateAdventureText` | gemini-2.5-flash | Generate game narrative from player actions |
| `generateSceneImage` | gemini-2.5-flash-image / gemini-3-pro-image-preview | Create scene illustrations |
| `generateSceneVideo` | veo-3.1-fast-generate-preview | Animate scene images |
| `generateSpeech` | gemini-2.5-flash-preview-tts | Narrate text as audio |

## Conventions

- All functions are async and return `Promise<T | null>`
- Wrap API calls in try/catch, return `null` on error
- Log errors with `console.error`
- Use `getClient()` to access the GoogleGenAI instance
- API key from `process.env.API_KEY`

## Image Quality Modes

- `fast`: Uses `gemini-2.5-flash-image` (faster, lower quality)
- `quality`: Uses `gemini-3-pro-image-preview` with 1K resolution

## Testing

- Mock `@google/genai` module
- Test success and error paths
- Test file: `gemini/gemini.test.ts`
