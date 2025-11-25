# Agent Service

AI-powered game master using Vercel AI SDK with tool calling for state management.

## Architecture

```
agent/
├── index.ts          # Re-exports
├── types.ts          # Type definitions (GameMemory, AgentContext, etc.)
├── memory.ts         # Long-term memory persistence and retrieval
├── tools.ts          # AI SDK tools (inventory, quests, NPCs, etc.)
└── gameMaster.ts     # Main GameMasterAgent class
```

## GameMasterAgent

The central agent class that orchestrates game turns using `generateText` with tools.

### Key Features
- **Tool-based state management**: Instead of parsing structured output, the agent uses tools to update game state
- **Sliding window history**: Only recent conversation turns sent to model
- **Long-term memory**: Event log, NPC registry, world state persisted separately
- **Auto-summarization**: Periodically compresses history into summary

### Tools Available
| Tool | Purpose |
|------|---------|
| `recallMemory` | Search past events, NPCs, locations |
| `logEvent` | Record important story moments |
| `checkInventory` | View player items |
| `modifyInventory` | Add/remove items |
| `updatePlayerStatus` | Change HP, location, currency |
| `getActiveQuest` | View current quest details |
| `updateQuest` | Create/complete/fail quests |
| `registerNPC` | Track NPCs with visual tags |
| `setCharacterProfile` | Set player character during creation |

## Usage

```typescript
import { createGameMaster } from '@/services/agent';

const agent = createGameMaster();
const response = await agent.processInput("I explore the cave");
```

## Dependencies
- `ai` - Vercel AI SDK
- `@ai-sdk/google` - Google Gemini provider
- `zod` - Schema validation for tools
