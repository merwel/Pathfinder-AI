import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import {
  generateFallbackBatch1,
  generateFallbackBatch2,
  generateFallbackBatch3,
} from "./fallbackGenerator";

/**
 * Universal AI provider interface for structured JSON output.
 * Swappable via environment variable AI_PROVIDER = "gemini" | "openai".
 */
export interface AIProvider {
  generateStructured<T = unknown>(
    prompt: string,
    jsonSchema: Record<string, unknown>
  ): Promise<T>;
}

/**
 * Strips markdown code blocks (e.g. ```json ... ```) if present in raw text.
 */
function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return cleaned.trim();
}

/**
 * Gemini Provider using the official current @google/genai SDK
 * Uses responseMimeType: "application/json" and responseJsonSchema.
 */
class GeminiProvider implements AIProvider {
  private client: GoogleGenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "placeholder" || apiKey.includes("Placeholder")) {
      console.warn(
        "[AI Provider: Gemini] GEMINI_API_KEY is not configured or using placeholder."
      );
    }
    this.client = new GoogleGenAI({
      apiKey: apiKey || "",
    });
    this.model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  }

  async generateStructured<T = unknown>(
    prompt: string,
    jsonSchema: Record<string, unknown>
  ): Promise<T> {
    const apiKey = process.env.GEMINI_API_KEY;
    const isPlaceholder = !apiKey || apiKey === "placeholder" || apiKey.includes("Placeholder") || apiKey.startsWith("AIzaSyPlaceholder");

    if (isPlaceholder) {
      console.log(
        "[AI Provider: Gemini] GEMINI_API_KEY not set. Using intelligent curated destination generator."
      );
      return this.generateFallback<T>(prompt, jsonSchema);
    }

    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: jsonSchema as any,
          temperature: 0.7,
        },
      });

      const responseText = response.text || "";
      if (!responseText) {
        throw new Error("Gemini returned an empty response.");
      }

      const parsed = JSON.parse(cleanJsonString(responseText)) as T;
      return parsed;
    } catch (error: any) {
      console.warn(
        `[AI Provider: Gemini] Generation failed (${error?.message || error}). Falling back to destination intelligence.`
      );
      return this.generateFallback<T>(prompt, jsonSchema);
    }
  }

  private generateFallback<T = unknown>(
    prompt: string,
    jsonSchema: Record<string, unknown>
  ): T {
    const props = (jsonSchema.properties as Record<string, unknown>) || {};
    if (prompt.includes("Batch 1") || "abouttheplace" in props) {
      return generateFallbackBatch1(prompt) as unknown as T;
    }
    if (prompt.includes("Batch 2") || "adventuresactivitiestodo" in props) {
      return generateFallbackBatch2(prompt) as unknown as T;
    }
    if (prompt.includes("Batch 3") || "topplacestovisit" in props) {
      return generateFallbackBatch3(prompt) as unknown as T;
    }
    return generateFallbackBatch1(prompt) as unknown as T;
  }
}

/**
 * OpenAI Provider using openai SDK
 * Uses response_format: { type: "json_object" } or json_schema.
 */
class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    this.client = new OpenAI({
      apiKey: apiKey || "",
    });
    this.model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  }

  async generateStructured<T = unknown>(
    prompt: string,
    jsonSchema: Record<string, unknown>
  ): Promise<T> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is not set. Please set a valid OpenAI key in your environment."
      );
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are an expert travel assistant. Output ONLY valid JSON adhering strictly to the provided JSON Schema.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: {
          type: "json_object",
        },
        temperature: 0.7,
      });

      const content = completion.choices[0]?.message?.content || "";
      if (!content) {
        throw new Error("OpenAI returned an empty completion.");
      }

      const parsed = JSON.parse(cleanJsonString(content)) as T;
      return parsed;
    } catch (error: any) {
      console.error("[AI Provider: OpenAI] Generation error:", error?.message || error);
      throw error;
    }
  }
}

/**
 * Exported singleton function that delegates to the configured provider.
 */
export async function generateStructured<T = unknown>(
  prompt: string,
  jsonSchema: Record<string, unknown>
): Promise<T> {
  const providerType = (process.env.AI_PROVIDER || "gemini").toLowerCase();

  let provider: AIProvider;
  if (providerType === "openai") {
    provider = new OpenAIProvider();
  } else {
    provider = new GeminiProvider();
  }

  try {
    return await provider.generateStructured<T>(prompt, jsonSchema);
  } catch (error: any) {
    console.warn(
      `[AI Provider] All providers failed (${error?.message || error}). Invoking safe destination fallback.`
    );
    const props = (jsonSchema.properties as Record<string, unknown>) || {};
    if (prompt.includes("Batch 1") || "abouttheplace" in props) {
      return generateFallbackBatch1(prompt) as unknown as T;
    }
    if (prompt.includes("Batch 2") || "adventuresactivitiestodo" in props) {
      return generateFallbackBatch2(prompt) as unknown as T;
    }
    if (prompt.includes("Batch 3") || "topplacestovisit" in props) {
      return generateFallbackBatch3(prompt) as unknown as T;
    }
    return generateFallbackBatch1(prompt) as unknown as T;
  }
}
