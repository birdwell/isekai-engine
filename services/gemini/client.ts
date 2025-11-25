import { GoogleGenAI } from "@google/genai";

export const getClient = (): GoogleGenAI => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
  }
  return new GoogleGenAI({ apiKey: apiKey || "MISSING_KEY" });
};
