# Utils

Pure utility functions for data transformation and parsing.

## Available Utilities

| File | Purpose |
|------|---------|
| `parser.ts` | Parse Gemini text responses into structured `GameResponse` |
| `markdown.tsx` | Render markdown text as React elements |
| `audio.ts` | Decode base64 audio to AudioBuffer for playback |

## parser.ts

Parses AI-generated narrative text into structured game data:

```ts
parseGameResponse(text: string): GameResponse
```

Extracts:
- `narrative` - Story text
- `choices` - Player action options
- `scenePrompt` - Image generation prompt  
- `status` - Character stats, inventory, location, quest

Uses regex to find JSON blocks and markdown sections.

## markdown.tsx

Converts markdown strings to React elements:

```tsx
renderMarkdown(text: string): React.ReactNode
```

Supports: bold (`**`), italic (`*`), inline code, paragraphs.

## audio.ts

Audio decoding utilities:

```ts
decodeBase64(base64: string): Uint8Array
decodeAudioData(pcmData: Uint8Array, ctx: AudioContext, sampleRate: number, channels: number): Promise<AudioBuffer>
```

Converts base64 PCM audio from Gemini TTS to playable AudioBuffer.

## Conventions

- Pure functions (no side effects)
- Comprehensive error handling
- 100% test coverage target
- Test file naming: `utilName.test.ts`
