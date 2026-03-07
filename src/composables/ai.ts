import { ref } from "vue";
import { useSettings } from "./settings";

interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

function generatePreviewUrl(html: string): string {
  const blob = new Blob([html], { type: "text/html" });
  return URL.createObjectURL(blob);
}

export function useAI() {
  const { settings } = useSettings();
  const isStreaming = ref(false);

  async function streamChat(message: string, callbacks: StreamCallbacks) {
    if (!settings.value.apiKey) {
      callbacks.onError(new Error("API key not configured"));
      return;
    }

    isStreaming.value = true;

    try {
      if (settings.value.provider === "deepseek") {
        await streamDeepseek(message, callbacks);
      } else {
        await streamKimi(message, callbacks);
      }
    } catch (error) {
      callbacks.onError(error as Error);
    } finally {
      isStreaming.value = false;
    }
  }

  async function streamDeepseek(message: string, callbacks: StreamCallbacks) {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.value.apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful web developer assistant. When asked to create a website, provide complete, self-contained HTML code that can be directly rendered in a browser. Always wrap your HTML code in triple backticks with the html language identifier.",
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

  async function streamKimi(message: string, callbacks: StreamCallbacks) {
    const response = await fetch(
      "https://api.moonshot.cn/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${settings.value.apiKey}`,
        },
        body: JSON.stringify({
          model: "moonshot-v1-8k",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful web developer assistant. When asked to create a website, provide complete, self-contained HTML code that can be directly rendered in a browser. Always wrap your HTML code in triple backticks with the html language identifier.",
            },
            { role: "user", content: message },
          ],
          stream: true,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Kimi API error: ${response.status}`);
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

  return {
    isStreaming,
    streamChat,
    generatePreviewUrl,
  };
}
