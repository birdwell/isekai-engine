import { getClient } from "./client";
import { STRICT_ART_STYLE } from "./prompts";
import { createTrace } from "@/services/langfuse";

export const generateSceneVideo = async (
  prompt: string,
  imageBase64: string
): Promise<string | null> => {
  const trace = createTrace("generate-scene-video");

  const generation = trace.generation({
    name: "veo-3.1-fast-generate-preview",
    model: "veo-3.1-fast-generate-preview",
    input: { prompt, hasImage: !!imageBase64 },
  });

  try {
    const ai = getClient();

    const base64Data = imageBase64.split(",")[1];
    const mimeType = imageBase64.substring(
      imageBase64.indexOf(":") + 1,
      imageBase64.indexOf(";")
    );

    let operation = await ai.models.generateVideos({
      model: "veo-3.1-fast-generate-preview",
      prompt:
        `${STRICT_ART_STYLE} ${prompt}` ||
        "Cinematic movement, slow motion, fantasy anime style",
      image: {
        imageBytes: base64Data,
        mimeType: mimeType,
      },
      config: {
        numberOfVideos: 1,
        resolution: "720p",
        aspectRatio: "16:9",
      },
    });

    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("No video URI returned");

    const videoResponse = await fetch(
      `${downloadLink}&key=${process.env.API_KEY}`
    );
    const videoBlob = await videoResponse.blob();

    generation.end({
      output: { hasVideo: true },
    });

    return URL.createObjectURL(videoBlob);
  } catch (error) {
    generation.end({
      level: "ERROR",
      statusMessage: error instanceof Error ? error.message : String(error),
    });
    console.error("Error generating video:", error);
    return null;
  }
};
