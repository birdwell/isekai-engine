import { GameResponse, Choice, GameStatus } from "../types";

export const parseGameResponse = (text: string): GameResponse => {
  const response: GameResponse = {
    scenePrompt: "",
    narrative: "",
    status: null,
    choices: [],
    rawText: text,
  };

  // Helper regexes
  const sceneRegex = /\[SCENE VISUALIZATION\]([\s\S]*?)(\[NARRATIVE\]|\[STATUS\]|\[CHOICES\]|$)/i;
  const narrativeRegex = /\[NARRATIVE\]([\s\S]*?)(\[STATUS\]|\[CHOICES\]|$)/i;
  const statusRegex = /\[STATUS\]([\s\S]*?)(\[CHOICES\]|$)/i;
  const choicesRegex = /\[CHOICES\]([\s\S]*?)$/i;

  // Extract Scene
  const sceneMatch = text.match(sceneRegex);
  if (sceneMatch && sceneMatch[1]) {
    response.scenePrompt = sceneMatch[1].trim();
  }

  // Extract Narrative
  const narrativeMatch = text.match(narrativeRegex);
  if (narrativeMatch && narrativeMatch[1]) {
    response.narrative = narrativeMatch[1].trim();
  } else {
    // Fallback: If no strict tags, assume everything is narrative (early game edge cases)
    // But only if other tags are missing
    if (!text.includes('[NARRATIVE]') && !text.includes('[STATUS]')) {
        response.narrative = text;
    }
  }

  // Extract Status
  const statusMatch = text.match(statusRegex);
  if (statusMatch && statusMatch[1]) {
    const statusText = statusMatch[1];
    const hp = statusText.match(/\*\*HP:\*\*\s*(.*)/i)?.[1]?.trim() || "Unknown";
    const location = statusText.match(/\*\*Location:\*\*\s*(.*)/i)?.[1]?.trim() || "Unknown";
    const quest = statusText.match(/\*\*Active Quest:\*\*\s*(.*)/i)?.[1]?.trim() || "Unknown";
    
    // Inventory parsing
    const inventoryMatch = statusText.match(/\*\*Inventory:\*\*\s*(.*)/i);
    const inventory = inventoryMatch ? inventoryMatch[1].split(',').map(i => i.trim()).filter(i => i) : [];

    // Currency Parsing
    const moneyMatch = statusText.match(/\*\*Money:\*\*\s*(?:\[?(\d+)\]?|(\d+))\s*Gold,?\s*(?:\[?(\d+)\]?|(\d+))\s*Silver,?\s*(?:\[?(\d+)\]?|(\d+))\s*Copper/i);
    
    let gold = 0, silver = 0, copper = 0;
    if (moneyMatch) {
        // Regex captures might be in different groups depending on if brackets [ ] were used or not
        gold = parseInt(moneyMatch[1] || moneyMatch[2] || "0", 10);
        silver = parseInt(moneyMatch[3] || moneyMatch[4] || "0", 10);
        copper = parseInt(moneyMatch[5] || moneyMatch[6] || "0", 10);
    }

    response.status = {
      hp,
      location,
      inventory,
      activeQuest: quest,
      currency: { gold, silver, copper }
    };
  }

  // Extract Choices
  const choicesMatch = text.match(choicesRegex);
  if (choicesMatch && choicesMatch[1]) {
    const lines = choicesMatch[1].split('\n').filter(line => line.trim().length > 0);
    const parsedChoices: Choice[] = [];
    
    lines.forEach(line => {
      // Match patterns like "A. Run away" or "1. Run away"
      const match = line.match(/^([A-Z0-9]+)[\.\)]\s*(.*)/);
      if (match) {
        parsedChoices.push({
          id: match[1],
          text: match[2].trim()
        });
      }
    });
    response.choices = parsedChoices;
  }

  return response;
};