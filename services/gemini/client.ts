import { GoogleGenAI } from "@google/genai";

export const getClient = (): GoogleGenAI => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "MISSING_KEY",
    // SDK 3 defaults to the stable v1 API. Preview image, speech, and video
    // models used by this app are only served on v1beta.
    apiVersion: "v1beta",
  });
};
