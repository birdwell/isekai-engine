import { getClient } from "./client";
import { STRICT_ART_STYLE } from "./prompts";
import { createTrace } from "@/services/langfuse";

export type ImageQuality = "fast" | "quality";

export const generateSceneImage = async (
  prompt: string,
  quality: ImageQuality = "fast"
): Promise<string | null> => {
  const modelName =
    quality === "fast"
      ? "gemini-2.5-flash-image"
      : "gemini-3-pro-image-preview";

  const trace = createTrace("generate-scene-image", { quality });

  const generation = trace.generation({
    name: modelName,
    model: modelName,
    input: { prompt, quality },
  });

  try {
    const ai = getClient();

    const finalPrompt = `${STRICT_ART_STYLE} \n\n SCENE DESCRIPTION: ${prompt}`;

    const imageConfig =
      quality === "quality"
        ? {
            imageSize: "1K",
          }
        : undefined;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [{ text: finalPrompt }],
      },
      config: imageConfig ? { imageConfig } : undefined,
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        generation.end({
          output: { mimeType: part.inlineData.mimeType, hasData: true },
        });
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    generation.end({ output: null });
    return null;
  } catch (error) {
    generation.end({
      level: "ERROR",
      statusMessage: error instanceof Error ? error.message : String(error),
    });
    console.error("Error generating scene image:", error);
    return null;
  }
};
