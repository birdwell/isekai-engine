
import { GoogleGenAI, Content, Modality } from "@google/genai";
import { ChatMessage } from "../types";

// Defines the visual identity of the game to ensure cohesion across generations
// Updated to "Frieren" style: Soft, pastel, matte, analog, nostalgic.
const STRICT_ART_STYLE = `
STRICT VISUAL STYLE: 
Anime Concept Art, "Frieren: Beyond Journey's End" Aesthetic.
Palette: Soft, warm, muted pastels. Low saturation. No neon, no high contrast.
Texture: Matte painting, analog film feel, subtle film grain, slight chromatic aberration.
Lighting: Natural, diffused, cozy, "Golden Hour" or soft overcast.
Character Design: Realistic proportions (not chibi/exaggerated), understated expressions, detailed clothing folds.
Line Art: Delicate, thin, pencil-like.
Negative Prompt: NO 3D render, NO shiny plastic skin, NO heavy bloom, NO hyper-realism, NO oily textures, NO dark gritty horror, NO thick black outlines.
`;

const SYSTEM_INSTRUCTION = `
Act as "The Isekai Engine," an immersive, interactive text-adventure game master. Your goal is to guide the user through a "Choose Your Own Adventure" style roleplaying game set in a fantasy world.

### CORE RULES:
1.  **Perspective:** Always write in the second person ("You see...", "You feel...").
2.  **Tone:** specific to the Isekai genre—mix of high fantasy, anime tropes, and adventure. Keep it rated PG-13 (Action is fine, no extreme gore/horror).
3.  **Format:** Every response must follow the strict output format defined below.
4.  **Agency:** Never decide the user's actions for them. Stop and wait for input.
5.  **Memory:** Track the user's Name, Class, Main Cheat Skill, Health (HP), Inventory, and Money within the [STATUS] block.

### VISUAL CONSISTENCY (CRITICAL):
*   **Character Permanence:** You MUST maintain a consistent visual description for the protagonist and key characters.
*   **Registry:** When a main character (including the player) is defined, create a "Visual Tag List" for them (e.g., "Player: messy black hair, red scarf, obsidian armor").
*   **Application:** In every **[SCENE VISUALIZATION]** prompt where the character appears, **YOU MUST** include their exact visual tags. Do not vary their core appearance (hair color, clothing style, distinctive features) unless they change equipment.

### THE ONBOARDING (START OF GAME):
Do not start the adventure immediately. You must first roleplay as "The Administrator" (The God of this world).
1.  Start the chat in a "Divine Realm."
2.  The God should explain that the user has died (create a humorous or tragic cause of death) and is being reincarnated.
3.  Guide the user through a character creation process:
    *   **Select a World Type:** (e.g., High Fantasy, Cyberpunk Magic, Grimdark, Otome Game).
    *   **Select a Cheat Skill:** Offer 3 distinct, overpowered unique abilities, or let the user write their own.
    *   **Select a Class:** (e.g., Mage, Sword Saint, Rogue, Merchant).
    *   **Starter Kit:** Give them 10 Gold, 0 Silver, 0 Copper and a basic weapon.
Once character creation is done, transport the user to the world and begin the story.

### OUTPUT FORMAT (REQUIRED FOR EVERY TURN):

**[SCENE VISUALIZATION]**
(Write a descriptive prompt describing the current scene for an artist. Focus on the subject and environment. Use soft, painterly adjectives. IMPORTANT: Include specific visual tags for the main character if they are present.)

**[NARRATIVE]**
(The story content. Be concise and punchy. Keep it between 50-80 words to maintain a fast pace.)

**[STATUS]**
*   **HP:** [Current/Max]
*   **Location:** [Current Location]
*   **Money:** [X] Gold, [Y] Silver, [Z] Copper
*   **Inventory:** [List items, comma separated]
*   **Active Quest:** [Current Goal]

**[CHOICES]**
A. [Action Option 1]
B. [Action Option 2]
C. [Action Option 3]
D. [Custom Input - Type your own action]
`;

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("API_KEY is missing from environment variables.");
    }
    // We recreate the client to ensure we capture the latest key if it was selected via window.aistudio
    return new GoogleGenAI({ apiKey: apiKey || 'MISSING_KEY' });
}

export const generateAdventureText = async (history: ChatMessage[], userInput: string): Promise<string> => {
  try {
    const ai = getClient();
    const formattedHistory: Content[] = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    const model = ai.models;
    
    const contents: Content[] = [
      ...formattedHistory,
      { role: 'user', parts: [{ text: userInput }] }
    ];

    const response = await model.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.9, 
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text generated");
    return text;

  } catch (error) {
    console.error("Error generating adventure text:", error);
    throw error;
  }
};

export const generateSceneImage = async (prompt: string, quality: 'fast' | 'quality' = 'fast'): Promise<string | null> => {
  try {
    const ai = getClient();
    
    // Combine the strict style guide with the specific scene prompt
    const finalPrompt = `${STRICT_ART_STYLE} \n\n SCENE DESCRIPTION: ${prompt}`;

    const modelName = quality === 'fast' ? 'gemini-2.5-flash-image' : 'gemini-3-pro-image-preview';
    
    // Config only supported on Pro
    const imageConfig = quality === 'quality' ? {
        imageSize: "1K"
    } : undefined;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { text: finalPrompt }
        ]
      },
      config: imageConfig ? { imageConfig } : undefined
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating scene image:", error);
    return null; 
  }
};

export const generateSceneVideo = async (prompt: string, imageBase64: string): Promise<string | null> => {
    try {
        const ai = getClient();
        
        // Strip the data:image/png;base64, prefix
        const base64Data = imageBase64.split(',')[1];
        const mimeType = imageBase64.substring(imageBase64.indexOf(':') + 1, imageBase64.indexOf(';'));

        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: `${STRICT_ART_STYLE} ${prompt}` || "Cinematic movement, slow motion, fantasy anime style",
            image: {
                imageBytes: base64Data,
                mimeType: mimeType,
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({operation: operation});
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("No video URI returned");

        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const videoBlob = await videoResponse.blob();
        return URL.createObjectURL(videoBlob);

    } catch (error) {
        console.error("Error generating video:", error);
        return null;
    }
}

export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: { parts: [{ text }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' }, 
          },
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData?.data) {
      return part.inlineData.data;
    }
    return null;
  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
};
