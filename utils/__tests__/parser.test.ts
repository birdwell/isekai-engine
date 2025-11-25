import { describe, it, expect } from 'vitest';
import { parseGameResponse } from '../parser';

describe('parseGameResponse', () => {
  describe('scene parsing', () => {
    it('extracts scene visualization', () => {
      const text = `[SCENE VISUALIZATION]
A dark forest with towering oak trees
[NARRATIVE]
You enter the forest.`;
      
      const result = parseGameResponse(text);
      expect(result.scenePrompt).toBe('A dark forest with towering oak trees');
    });

    it('handles missing scene visualization', () => {
      const text = `[NARRATIVE]
You enter the forest.`;
      
      const result = parseGameResponse(text);
      expect(result.scenePrompt).toBe('');
    });
  });

  describe('narrative parsing', () => {
    it('extracts narrative text', () => {
      const text = `[NARRATIVE]
The wind howls through the trees. You feel a chill run down your spine.
[STATUS]
**HP:** 100`;
      
      const result = parseGameResponse(text);
      expect(result.narrative).toBe('The wind howls through the trees. You feel a chill run down your spine.');
    });

    it('uses full text as fallback when no tags present', () => {
      const text = 'Just some plain narrative without any tags.';
      
      const result = parseGameResponse(text);
      expect(result.narrative).toBe(text);
    });

    it('handles multi-line narrative', () => {
      const text = `[NARRATIVE]
Line one.

Line two.

Line three.
[STATUS]
**HP:** 50`;
      
      const result = parseGameResponse(text);
      expect(result.narrative).toContain('Line one.');
      expect(result.narrative).toContain('Line two.');
      expect(result.narrative).toContain('Line three.');
    });
  });

  describe('status parsing', () => {
    it('extracts HP', () => {
      const text = `[STATUS]
**HP:** 75/100
[CHOICES]`;
      
      const result = parseGameResponse(text);
      expect(result.status?.hp).toBe('75/100');
    });

    it('extracts location', () => {
      const text = `[STATUS]
**Location:** The Enchanted Forest
[CHOICES]`;
      
      const result = parseGameResponse(text);
      expect(result.status?.location).toBe('The Enchanted Forest');
    });

    it('extracts active quest', () => {
      const text = `[STATUS]
**Active Quest:** Find the Lost Artifact
[CHOICES]`;
      
      const result = parseGameResponse(text);
      expect(result.status?.activeQuest).toBe('Find the Lost Artifact');
    });

    it('parses inventory list', () => {
      const text = `[STATUS]
**Inventory:** Sword, Shield, Health Potion
[CHOICES]`;
      
      const result = parseGameResponse(text);
      expect(result.status?.inventory).toEqual(['Sword', 'Shield', 'Health Potion']);
    });

    it('handles empty inventory', () => {
      const text = `[STATUS]
**Inventory:** 
[CHOICES]`;
      
      const result = parseGameResponse(text);
      expect(result.status?.inventory).toEqual([]);
    });

    it('parses skills list', () => {
      const text = `[STATUS]
**Skills:** Fire Magic, Swordsmanship, Stealth
[CHOICES]`;
      
      const result = parseGameResponse(text);
      expect(result.status?.skills).toEqual(['Fire Magic', 'Swordsmanship', 'Stealth']);
    });

    it('parses currency with plain numbers', () => {
      const text = `[STATUS]
**Money:** 10 Gold, 5 Silver, 25 Copper
[CHOICES]`;
      
      const result = parseGameResponse(text);
      expect(result.status?.currency).toEqual({ gold: 10, silver: 5, copper: 25 });
    });

    it('parses currency with bracketed numbers', () => {
      const text = `[STATUS]
**Money:** [50] Gold, [20] Silver, [100] Copper
[CHOICES]`;
      
      const result = parseGameResponse(text);
      expect(result.status?.currency).toEqual({ gold: 50, silver: 20, copper: 100 });
    });

    it('defaults to zero currency when not present', () => {
      const text = `[STATUS]
**HP:** 100
[CHOICES]`;
      
      const result = parseGameResponse(text);
      expect(result.status?.currency).toEqual({ gold: 0, silver: 0, copper: 0 });
    });

    it('defaults unknown values', () => {
      const text = `[STATUS]

[CHOICES]`;
      
      const result = parseGameResponse(text);
      expect(result.status?.hp).toBe('Unknown');
      expect(result.status?.location).toBe('Unknown');
      expect(result.status?.activeQuest).toBe('Unknown');
    });
  });

  describe('choices parsing', () => {
    it('parses choices with letter IDs', () => {
      const text = `[CHOICES]
A. Run away
B. Fight the dragon
C. Negotiate`;
      
      const result = parseGameResponse(text);
      expect(result.choices).toHaveLength(3);
      expect(result.choices[0]).toEqual({ id: 'A', text: 'Run away' });
      expect(result.choices[1]).toEqual({ id: 'B', text: 'Fight the dragon' });
      expect(result.choices[2]).toEqual({ id: 'C', text: 'Negotiate' });
    });

    it('parses choices with numeric IDs', () => {
      const text = `[CHOICES]
1. Option one
2. Option two`;
      
      const result = parseGameResponse(text);
      expect(result.choices).toHaveLength(2);
      expect(result.choices[0]).toEqual({ id: '1', text: 'Option one' });
      expect(result.choices[1]).toEqual({ id: '2', text: 'Option two' });
    });

    it('parses choices with parentheses format', () => {
      const text = `[CHOICES]
A) First choice
B) Second choice`;
      
      const result = parseGameResponse(text);
      expect(result.choices).toHaveLength(2);
      expect(result.choices[0]).toEqual({ id: 'A', text: 'First choice' });
    });

    it('handles empty choices section', () => {
      const text = `[CHOICES]
`;
      
      const result = parseGameResponse(text);
      expect(result.choices).toEqual([]);
    });

    it('filters out invalid choice lines', () => {
      const text = `[CHOICES]
A. Valid choice
Some random text
B. Another valid choice`;
      
      const result = parseGameResponse(text);
      expect(result.choices).toHaveLength(2);
    });
  });

  describe('rawText preservation', () => {
    it('preserves the original raw text', () => {
      const text = `[NARRATIVE]
Some narrative text.
[CHOICES]
A. Option`;
      
      const result = parseGameResponse(text);
      expect(result.rawText).toBe(text);
    });
  });

  describe('full response parsing', () => {
    it('parses a complete game response', () => {
      const text = `[SCENE VISUALIZATION]
A medieval tavern with roaring fireplace and wooden tables
[NARRATIVE]
You push open the heavy oak door and step into the warmth of the tavern. The smell of roasted meat fills the air. A bard plays a lute in the corner.
[STATUS]
**HP:** 100/100
**Location:** The Rusty Tankard Tavern
**Inventory:** Sword, Leather Armor, 3 Health Potions
**Skills:** Swordsmanship, Persuasion
**Active Quest:** Find the Missing Merchant
**Money:** 15 Gold, 7 Silver, 32 Copper
[CHOICES]
A. Approach the bartender
B. Listen to the bard
C. Sit at an empty table
D. Leave the tavern`;
      
      const result = parseGameResponse(text);
      
      expect(result.scenePrompt).toContain('medieval tavern');
      expect(result.narrative).toContain('heavy oak door');
      expect(result.status?.hp).toBe('100/100');
      expect(result.status?.location).toBe('The Rusty Tankard Tavern');
      expect(result.status?.inventory).toContain('Sword');
      expect(result.status?.skills).toContain('Persuasion');
      expect(result.status?.activeQuest).toBe('Find the Missing Merchant');
      expect(result.status?.currency).toEqual({ gold: 15, silver: 7, copper: 32 });
      expect(result.choices).toHaveLength(4);
    });
  });
});
