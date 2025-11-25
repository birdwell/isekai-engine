import { describe, it, expect } from 'vitest';
import { STRICT_ART_STYLE, SYSTEM_INSTRUCTION } from '../prompts';

describe('STRICT_ART_STYLE', () => {
  it('includes anime aesthetic reference', () => {
    expect(STRICT_ART_STYLE).toContain('Anime');
    expect(STRICT_ART_STYLE).toContain('Frieren');
  });

  it('defines color palette constraints', () => {
    expect(STRICT_ART_STYLE).toContain('Soft');
    expect(STRICT_ART_STYLE).toContain('pastel');
    expect(STRICT_ART_STYLE).toContain('Low saturation');
  });

  it('includes negative prompts', () => {
    expect(STRICT_ART_STYLE).toContain('NO 3D render');
    expect(STRICT_ART_STYLE).toContain('NO shiny plastic');
  });

  it('defines lighting style', () => {
    expect(STRICT_ART_STYLE).toContain('Golden Hour');
    expect(STRICT_ART_STYLE).toContain('Natural');
    expect(STRICT_ART_STYLE).toContain('diffused');
  });
});

describe('SYSTEM_INSTRUCTION', () => {
  describe('core rules', () => {
    it('requires second person perspective', () => {
      expect(SYSTEM_INSTRUCTION).toContain('second person');
      expect(SYSTEM_INSTRUCTION).toContain('"You see..."');
    });

    it('sets PG-13 tone', () => {
      expect(SYSTEM_INSTRUCTION).toContain('PG-13');
    });

    it('requires strict output format', () => {
      expect(SYSTEM_INSTRUCTION).toContain('strict output format');
    });

    it('prevents AI from deciding user actions', () => {
      expect(SYSTEM_INSTRUCTION).toContain('Never decide the user\'s actions');
    });
  });

  describe('visual consistency', () => {
    it('requires character permanence', () => {
      expect(SYSTEM_INSTRUCTION).toContain('Character Permanence');
      expect(SYSTEM_INSTRUCTION).toContain('consistent visual description');
    });

    it('mentions visual tag list', () => {
      expect(SYSTEM_INSTRUCTION).toContain('Visual Tag List');
    });
  });

  describe('onboarding requirements', () => {
    it('includes The Administrator roleplay', () => {
      expect(SYSTEM_INSTRUCTION).toContain('The Administrator');
      expect(SYSTEM_INSTRUCTION).toContain('Divine Realm');
    });

    it('includes character creation steps', () => {
      expect(SYSTEM_INSTRUCTION).toContain('Select a World Type');
      expect(SYSTEM_INSTRUCTION).toContain('Select a Cheat Skill');
      expect(SYSTEM_INSTRUCTION).toContain('Select a Class');
      expect(SYSTEM_INSTRUCTION).toContain('Starter Kit');
    });

    it('includes initial currency', () => {
      expect(SYSTEM_INSTRUCTION).toContain('10 Gold');
      expect(SYSTEM_INSTRUCTION).toContain('0 Silver');
      expect(SYSTEM_INSTRUCTION).toContain('0 Copper');
    });
  });

  describe('output format sections', () => {
    it('includes SCENE VISUALIZATION section', () => {
      expect(SYSTEM_INSTRUCTION).toContain('[SCENE VISUALIZATION]');
    });

    it('includes NARRATIVE section', () => {
      expect(SYSTEM_INSTRUCTION).toContain('[NARRATIVE]');
    });

    it('includes STATUS section with all fields', () => {
      expect(SYSTEM_INSTRUCTION).toContain('[STATUS]');
      expect(SYSTEM_INSTRUCTION).toContain('**HP:**');
      expect(SYSTEM_INSTRUCTION).toContain('**Location:**');
      expect(SYSTEM_INSTRUCTION).toContain('**Money:**');
      expect(SYSTEM_INSTRUCTION).toContain('**Inventory:**');
      expect(SYSTEM_INSTRUCTION).toContain('**Skills:**');
      expect(SYSTEM_INSTRUCTION).toContain('**Active Quest:**');
    });

    it('includes CHOICES section with options', () => {
      expect(SYSTEM_INSTRUCTION).toContain('[CHOICES]');
      expect(SYSTEM_INSTRUCTION).toContain('A.');
      expect(SYSTEM_INSTRUCTION).toContain('B.');
      expect(SYSTEM_INSTRUCTION).toContain('C.');
      expect(SYSTEM_INSTRUCTION).toContain('D.');
    });

    it('includes custom input option', () => {
      expect(SYSTEM_INSTRUCTION).toContain('Custom Input');
    });
  });

  describe('narrative guidelines', () => {
    it('sets word count guidance', () => {
      expect(SYSTEM_INSTRUCTION).toContain('50-80 words');
    });

    it('emphasizes concise writing', () => {
      expect(SYSTEM_INSTRUCTION).toContain('concise');
    });
  });
});
