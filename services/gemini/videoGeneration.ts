import { getClient } from "./client";
import { STRICT_ART_STYLE } from "./prompts";

export const generateSceneVideo = async (
  prompt: string,
  imageBase64: string
): Promise<string | null> => {
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
    return URL.createObjectURL(videoBlob);
  } catch (error) {
    console.error("Error generating video:", error);
    return null;
  }
};
