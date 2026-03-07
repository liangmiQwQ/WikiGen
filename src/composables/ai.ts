import { ref } from "vue";
import { useSettings } from "./settings";
import type { WebsiteFormData } from "../types";

interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

function generatePreviewUrl(html: string): string {
  const blob = new Blob([html], { type: "text/html" });
  return URL.createObjectURL(blob);
}

export function extractHtmlFromResponse(content: string): string | null {
  const htmlMatch = content.match(/```html\n?([\s\S]*?)```/);
  return htmlMatch ? htmlMatch[1].trim() : null;
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

  return `Create a complete, self-contained 知识类网站 (knowledge-based website) about "${formData.topic}".

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

IMPORTANT: Wrap your complete HTML code in triple backticks with the html language identifier like this:
\`\`\`html
[Your HTML code here]
\`\`\``;
}

function buildModificationPrompt(
  currentHtml: string,
  modificationRequest: string,
  conversationHistory: string,
): string {
  return `I have an existing 知识类网站 (knowledge-based website) that I want to modify.

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

IMPORTANT: Wrap your complete HTML code in triple backticks with the html language identifier like this:
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
          content:
            "You are an expert web developer specializing in creating educational and knowledge-based websites. You create clean, modern, responsive HTML websites with excellent user experience. Always provide complete, self-contained HTML code that can be directly rendered in a browser.",
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
          content:
            "You are an expert web developer specializing in creating educational and knowledge-based websites. You create clean, modern, responsive HTML websites with excellent user experience. Always provide complete, self-contained HTML code that can be directly rendered in a browser.",
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
    modifyWebsite,
    generatePreviewUrl,
    extractHtmlFromResponse,
  };
}
