import { ref } from "vue";
import { useSettings } from "./settings";
import type { WebsiteFormData } from "../types";

interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

const AGENT_SYSTEM_PROMPT = `You are WikiGen Agent, a product-building AI assistant.
Always behave like an agent:
1) First explain your understanding and short execution plan in natural language.
2) Then provide the final complete HTML artifact in a \`\`\`html code block when website generation is requested.
3) Keep explanations concise, practical, and user-facing.
4) Do not output only code without explanation.
5) Preserve previous user constraints and avoid unnecessary rewrites.`;

function generatePreviewUrl(html: string): string {
  const blob = new Blob([html], { type: "text/html" });
  return URL.createObjectURL(blob);
}

export function extractHtmlFromResponse(content: string): string | null {
  const htmlBlockMatch = content.match(/```html\n?([\s\S]*?)```/i);
  if (htmlBlockMatch) return htmlBlockMatch[1].trim();

  const genericBlockMatch = content.match(/```\n?([\s\S]*?)```/);
  if (genericBlockMatch && /<html|<!doctype html/i.test(genericBlockMatch[1])) {
    return genericBlockMatch[1].trim();
  }

  const rawHtmlStart = content.search(/<!doctype html|<html/i);
  if (rawHtmlStart >= 0) {
    return content.slice(rawHtmlStart).trim();
  }

  return null;
}

export function toChatNarrative(content: string): string {
  const htmlRemoved = content
    .replaceAll(/```html[\s\S]*?```/gi, "")
    .replaceAll(/```[\s\S]*?```/g, (block) => {
      return /<html|<!doctype html/i.test(block) ? "" : block;
    })
    .trim();

  if (htmlRemoved) return htmlRemoved;
  if (extractHtmlFromResponse(content))
    return "Updated the website artifact. Open the Live Website panel to review.";
  return "Completed.";
}

function buildWebsitePrompt(formData: WebsiteFormData): string {
  const sectionsText =
    formData.keySections.length > 0
      ? `\nKey sections to include: ${formData.keySections.join(", ")}`
      : "";

  const styleMap: Record<string, string> = {
    modern: "modern, clean with contemporary design trends",
    classic: "classic, traditional with timeless aesthetics",
    minimal: "minimalist with focus on content and whitespace",
    colorful: "vibrant and colorful with engaging visual elements",
  };

  return `You are running an agent task to create a website artifact.

Task: Create a complete, self-contained 知识类网站 (knowledge-based website) about "${formData.topic}".

Target Audience: ${formData.targetAudience}
Style: ${styleMap[formData.stylePreference] || styleMap.modern}${sectionsText}

Additional Requirements:
${formData.additionalRequirements || "None"}

Requirements:
1. Create a complete, standalone HTML file with embedded CSS and JavaScript
2. Use modern, semantic HTML5 structure
3. Include proper responsive design for mobile and desktop
4. Use inline styles or <style> tags - no external CSS files
5. Include interactive elements where appropriate
6. The website should be educational and informative
7. Use a clean, readable color scheme appropriate for a knowledge website

Response format:
1) Briefly state: understanding, plan, and key implementation choices (short bullet list).
2) Then output the complete HTML in a single html code block.

IMPORTANT: Put your full HTML code in triple backticks with html identifier:
\`\`\`html
[Your HTML code here]
\`\`\``;
}

function buildModificationPrompt(
  currentHtml: string,
  modificationRequest: string,
  conversationHistory: string,
): string {
  return `You are running an agent update task for an existing website artifact.

I have an existing 知识类网站 (knowledge-based website) that I want to modify.

Here is the current HTML code:
\`\`\`html
${currentHtml}
\`\`\`

Previous conversation context:
${conversationHistory}

Modification request: ${modificationRequest}

Please provide the complete updated HTML code with the requested changes. Make sure to:
1. Keep the overall structure and purpose of the knowledge website
2. Apply only the requested modifications
3. Return the FULL HTML code, not just the changes
4. Wrap your complete HTML code in triple backticks with the html language identifier

Response format:
1) Briefly state: what will change and what will stay unchanged.
2) Then output the full updated HTML in one html code block.

IMPORTANT: Put your full updated HTML in triple backticks with html identifier:
\`\`\`html
[Your updated HTML code here]
\`\`\``;
}

async function streamDeepseek(
  message: string,
  apiKey: string,
  callbacks: StreamCallbacks,
) {
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: AGENT_SYSTEM_PROMPT,
        },
        { role: "user", content: message },
      ],
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No reader available");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            callbacks.onComplete();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              callbacks.onChunk(content);
            }
          } catch {
            // Ignore parsing errors for incomplete chunks
          }
        }
      }
    }
    callbacks.onComplete();
  } finally {
    reader.releaseLock();
  }
}

async function streamMoonshot(
  message: string,
  apiKey: string,
  endpoint: string,
  callbacks: StreamCallbacks,
) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "moonshot-v1-8k",
      messages: [
        {
          role: "system",
          content: AGENT_SYSTEM_PROMPT,
        },
        { role: "user", content: message },
      ],
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Moonshot API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No reader available");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            callbacks.onComplete();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              callbacks.onChunk(content);
            }
          } catch {
            // Ignore parsing errors for incomplete chunks
          }
        }
      }
    }
    callbacks.onComplete();
  } finally {
    reader.releaseLock();
  }
}

export function useAI() {
  const { settings, getCurrentApiKey } = useSettings();
  const isStreaming = ref(false);

  async function streamChat(message: string, callbacks: StreamCallbacks) {
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      callbacks.onError(
        new Error("API key not configured for the selected provider"),
      );
      return;
    }

    isStreaming.value = true;

    try {
      if (settings.value.provider === "deepseek") {
        await streamDeepseek(message, apiKey, callbacks);
      } else if (settings.value.provider === "moonshot-cn") {
        await streamMoonshot(
          message,
          apiKey,
          "https://api.moonshot.cn/v1/chat/completions",
          callbacks,
        );
      } else {
        await streamMoonshot(
          message,
          apiKey,
          "https://api.moonshot.com/v1/chat/completions",
          callbacks,
        );
      }
    } catch (error) {
      callbacks.onError(error as Error);
    } finally {
      isStreaming.value = false;
    }
  }

  async function generateWebsite(
    formData: WebsiteFormData,
    callbacks: StreamCallbacks,
  ) {
    const prompt = buildWebsitePrompt(formData);
    await streamChat(prompt, callbacks);
  }

  function generateDescription(formData: WebsiteFormData): Promise<string> {
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      return Promise.reject(
        new Error("API key not configured for the selected provider"),
      );
    }

    const prompt = `Write a very short, catchy one-sentence description (max 80 characters) for a knowledge website about "${formData.topic}". Target audience: ${formData.targetAudience || "general audience"}. Style: ${formData.stylePreference}. Respond with ONLY the description text, no quotes or additional formatting.`;

    let fullResponse = "";

    return new Promise((resolve, reject) => {
      streamChat(prompt, {
        onChunk: (chunk) => {
          fullResponse += chunk;
        },
        onComplete: () => {
          const description = fullResponse
            .trim()
            .replaceAll(/^["']|["']$/g, "");
          resolve(description || `Knowledge website about ${formData.topic}`);
        },
        onError: (error) => {
          reject(error);
        },
      });
    });
  }

  async function modifyWebsite(
    currentHtml: string,
    modificationRequest: string,
    conversationHistory: string,
    callbacks: StreamCallbacks,
  ) {
    const prompt = buildModificationPrompt(
      currentHtml,
      modificationRequest,
      conversationHistory,
    );
    await streamChat(prompt, callbacks);
  }

  return {
    isStreaming,
    streamChat,
    generateWebsite,
    generateDescription,
    modifyWebsite,
    generatePreviewUrl,
    extractHtmlFromResponse,
  };
}
