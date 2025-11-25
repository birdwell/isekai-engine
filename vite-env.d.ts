/// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    GEMINI_API_KEY: string;
    LANGFUSE_PUBLIC_KEY: string;
    LANGFUSE_SECRET_KEY: string;
    LANGFUSE_BASE_URL: string;
  }
}
