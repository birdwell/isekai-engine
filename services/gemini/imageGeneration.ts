import { getClient } from "./client";
import { STRICT_ART_STYLE } from "./prompts";

export type ImageQuality = "fast" | "quality";

export const generateSceneImage = async (
  prompt: string,
  quality: ImageQuality = "fast"
): Promise<string | null> => {
  try {
    const ai = getClient();

    const finalPrompt = `${STRICT_ART_STYLE} \n\n SCENE DESCRIPTION: ${prompt}`;

    const modelName =
      quality === "fast"
        ? "gemini-2.5-flash-image"
        : "gemini-3-pro-image-preview";

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
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating scene image:", error);
    return null;
  }
};
