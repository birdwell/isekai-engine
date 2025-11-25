import { Modality } from "@google/genai";
import { getClient } from "./client";

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
            prebuiltVoiceConfig: { voiceName: "Charon" },
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
