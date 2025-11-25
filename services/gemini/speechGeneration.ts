import { Modality } from "@google/genai";
import { getClient } from "./client";
import { createTrace } from "@/services/langfuse";

export const generateSpeech = async (text: string): Promise<string | null> => {
  const trace = createTrace("generate-speech");

  const generation = trace.generation({
    name: "gemini-2.5-flash-preview-tts",
    model: "gemini-2.5-flash-preview-tts",
    input: { textLength: text.length },
  });

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
      generation.end({
        output: { hasAudio: true },
      });
      return part.inlineData.data;
    }

    generation.end({ output: null });
    return null;
  } catch (error) {
    generation.end({
      level: "ERROR",
      statusMessage: error instanceof Error ? error.message : String(error),
    });
    console.error("Error generating speech:", error);
    return null;
  }
};
