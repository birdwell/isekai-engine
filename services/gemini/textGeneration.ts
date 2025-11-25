import { Content } from "@google/genai";
import { ChatMessage } from "@/types";
import { getClient } from "./client";
import { SYSTEM_INSTRUCTION } from "./prompts";

export const generateAdventureText = async (
  history: ChatMessage[],
  userInput: string
): Promise<string> => {
  try {
    const ai = getClient();
    const formattedHistory: Content[] = history.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    const contents: Content[] = [
      ...formattedHistory,
      { role: "user", parts: [{ text: userInput }] },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.9,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No text generated");
    return text;
  } catch (error) {
    console.error("Error generating adventure text:", error);
    throw error;
  }
};
