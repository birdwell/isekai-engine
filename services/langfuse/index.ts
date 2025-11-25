import { Langfuse } from "langfuse";

let langfuseInstance: Langfuse | null = null;
let currentUserId: string | null = null;
let currentSessionId: string | null = null;

export const getLangfuse = (): Langfuse => {
  if (!langfuseInstance) {
    langfuseInstance = new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_BASE_URL || "https://us.cloud.langfuse.com",
      flushAt: 1,
      flushInterval: 1000,
    });
  }
  return langfuseInstance;
};

export const setLangfuseUserId = (userId: string): void => {
  currentUserId = userId;
};

export const getLangfuseUserId = (): string | null => {
  return currentUserId;
};

export const setLangfuseSessionId = (sessionId: string): void => {
  currentSessionId = sessionId;
};

export const getLangfuseSessionId = (): string | null => {
  return currentSessionId;
};

export const createTrace = (
  name: string, 
  metadata?: Record<string, unknown>
) => {
  const langfuse = getLangfuse();
  return langfuse.trace({
    name,
    userId: currentUserId ?? undefined,
    sessionId: currentSessionId ?? undefined,
    metadata,
  });
};

export const flushLangfuse = async (): Promise<void> => {
  if (langfuseInstance) {
    await langfuseInstance.flushAsync();
  }
};

export const shutdownLangfuse = async (): Promise<void> => {
  if (langfuseInstance) {
    await langfuseInstance.shutdownAsync();
    langfuseInstance = null;
  }
};
