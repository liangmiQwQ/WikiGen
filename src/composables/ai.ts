import { ref } from "vue";
import { buildInitialTaskPrompt, CHAT_SYSTEM_PROMPT } from "../prompts/agent";
import {
  buildProjectTitlePrompt,
  PROJECT_TITLE_FALLBACK,
} from "../prompts/project-title";
import { useSettings } from "./settings";
import type { Message, WebsiteFormData } from "../types";

interface AgentToolHandlers {
  readHtmlFile: (path: string) => string;
  writeHtmlFile: (path: string, content: string, summary: string) => void;
  reportProgress: (stage: string, detail: string) => void;
}

interface ReplacePatchOperation {
  oldText: string;
  newText: string;
  replaceAll?: boolean;
}

interface HtmlPatchPayload {
  operations: ReplacePatchOperation[];
}

interface AgentCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
  onToolCallDetected: () => void;
}

type AgentRole = "user" | "assistant" | "system" | "tool";

interface AgentChatMessage {
  role: AgentRole;
  content: string;
  tool_call_id?: string;
  tool_calls?: {
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }[];
}

interface StreamResult {
  content: string;
  finishReason: string | null;
  toolCalls: {
    id: string;
    name: string;
    arguments: string;
  }[];
}

function toApiMessages(messages: Message[]): AgentChatMessage[] {
  return messages
    .filter((message) => message.kind !== "tool-run")
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}

const AGENT_TOOLS = [
  {
    type: "function",
    function: {
      name: "read_html_file",
      description: "Read the current html file content.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "File path. Use index.html.",
          },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "apply_html_patch",
      description:
        "Apply patch operations to html file content. Always call read_html_file first.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "File path. Use index.html.",
          },
          patch: {
            type: "object",
            description: "Patch operations to apply.",
            properties: {
              operations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    oldText: { type: "string" },
                    newText: { type: "string" },
                    replaceAll: { type: "boolean" },
                  },
                  required: ["oldText", "newText"],
                },
              },
            },
            required: ["operations"],
          },
          summary: {
            type: "string",
            description: "Short summary of this update.",
          },
        },
        required: ["path", "patch", "summary"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "report_progress",
      description: "Report progress updates shown in UI tool box.",
      parameters: {
        type: "object",
        properties: {
          stage: {
            type: "string",
            description: "Short stage title.",
          },
          detail: {
            type: "string",
            description: "One-line detail.",
          },
        },
        required: ["stage", "detail"],
      },
    },
  },
] as const;

async function streamDeepseek(
  apiKey: string,
  messages: AgentChatMessage[],
  signal: AbortSignal,
  callbacks: Pick<AgentCallbacks, "onChunk">,
): Promise<StreamResult> {
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      tools: AGENT_TOOLS,
      tool_choice: "auto",
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No reader available");

  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  let finishReason: string | null = null;
  const toolCallsByIndex = new Map<
    number,
    {
      id: string;
      name: string;
      arguments: string;
    }
  >();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6);

        if (data === "[DONE]") {
          return {
            content,
            finishReason,
            toolCalls: [...toolCallsByIndex.values()],
          };
        }

        let parsed: any;
        try {
          parsed = JSON.parse(data);
        } catch {
          continue;
        }

        const choice = parsed.choices?.[0];
        const delta = choice?.delta;
        finishReason = choice?.finish_reason ?? finishReason;

        const chunk = delta?.content;
        if (chunk) {
          content += chunk;
          callbacks.onChunk(chunk);
        }

        const toolCalls = delta?.tool_calls as
          | {
              index: number;
              id?: string;
              function?: {
                name?: string;
                arguments?: string;
              };
            }[]
          | undefined;

        if (!toolCalls) continue;

        for (const call of toolCalls) {
          const existing = toolCallsByIndex.get(call.index) || {
            id: "",
            name: "",
            arguments: "",
          };
          if (call.id) existing.id = call.id;
          if (call.function?.name) existing.name = call.function.name;
          if (call.function?.arguments)
            existing.arguments += call.function.arguments;
          toolCallsByIndex.set(call.index, existing);
        }
      }
    }

    return {
      content,
      finishReason,
      toolCalls: [...toolCallsByIndex.values()],
    };
  } finally {
    reader.releaseLock();
  }
}

async function runDescription(apiKey: string, prompt: string): Promise<string> {
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
          content: "Return concise plain text only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: false,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

function normalizeProjectTitle(raw: string): string {
  const cleaned = raw
    .replaceAll(/^["'`]+|["'`]+$/g, "")
    .replaceAll(/\s+/g, " ")
    .trim();
  if (!cleaned) return PROJECT_TITLE_FALLBACK;
  return cleaned.slice(0, 60);
}

function safeParseJson(raw: string): Record<string, any> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function applyHtmlPatch(content: string, payload: HtmlPatchPayload): string {
  if (!Array.isArray(payload.operations) || payload.operations.length === 0) {
    throw new Error("Patch requires at least one operation");
  }

  let next = content;
  for (const operation of payload.operations) {
    if (!operation.oldText) {
      throw new Error("Patch oldText cannot be empty");
    }

    if (operation.replaceAll) {
      if (!next.includes(operation.oldText)) {
        throw new Error("Patch oldText not found");
      }
      next = next.split(operation.oldText).join(operation.newText);
      continue;
    }

    const index = next.indexOf(operation.oldText);
    if (index === -1) {
      throw new Error("Patch oldText not found");
    }
    next =
      next.slice(0, index) +
      operation.newText +
      next.slice(index + operation.oldText.length);
  }

  return next;
}

function executeToolCall(
  toolCall: { id: string; name: string; arguments: string },
  handlers: AgentToolHandlers,
): string {
  const args = safeParseJson(toolCall.arguments);

  if (toolCall.name === "read_html_file") {
    const path = typeof args.path === "string" ? args.path : "index.html";
    const content = handlers.readHtmlFile(path);
    return JSON.stringify({ ok: true, path, content });
  }

  if (toolCall.name === "apply_html_patch") {
    const path = typeof args.path === "string" ? args.path : "index.html";
    const patch = args.patch as HtmlPatchPayload;
    const summary =
      typeof args.summary === "string" ? args.summary : "Updated website";

    const currentContent = handlers.readHtmlFile(path);
    if (!currentContent.trim()) {
      return JSON.stringify({
        ok: false,
        error: "No file content available for patching",
      });
    }

    try {
      const nextContent = applyHtmlPatch(currentContent, patch);
      handlers.writeHtmlFile(path, nextContent, summary);
      return JSON.stringify({
        ok: true,
        path,
        summary,
        operationCount: patch.operations.length,
      });
    } catch (error) {
      return JSON.stringify({
        ok: false,
        path,
        error: error instanceof Error ? error.message : "Patch apply failed",
      });
    }
  }

  if (toolCall.name === "report_progress") {
    const stage = typeof args.stage === "string" ? args.stage : "Progress";
    const detail = typeof args.detail === "string" ? args.detail : "";
    handlers.reportProgress(stage, detail);
    return JSON.stringify({ ok: true, stage, detail });
  }

  return JSON.stringify({ ok: false, error: `Unknown tool: ${toolCall.name}` });
}

export function useAI() {
  const { getCurrentApiKey } = useSettings();
  const isStreaming = ref(false);
  const abortController = ref<AbortController | null>(null);

  function cancelCurrentResponse() {
    abortController.value?.abort();
  }

  async function runAgentChat(
    conversationMessages: Message[],
    handlers: AgentToolHandlers,
    callbacks: AgentCallbacks,
    options?: {
      hiddenSystemPrompt?: string;
    },
  ) {
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      callbacks.onError(new Error("DeepSeek API key is not configured"));
      return;
    }

    abortController.value?.abort();
    const controller = new AbortController();
    abortController.value = controller;
    isStreaming.value = true;

    const messages: AgentChatMessage[] = [
      {
        role: "system",
        content: CHAT_SYSTEM_PROMPT,
      },
      ...(options?.hiddenSystemPrompt
        ? [
            {
              role: "system" as const,
              content: options.hiddenSystemPrompt,
            },
          ]
        : []),
      ...toApiMessages(conversationMessages),
    ];

    let fullResponse = "";
    let hasToolCall = false;

    try {
      for (let turns = 0; turns < 8; turns++) {
        const result = await streamDeepseek(
          apiKey,
          messages,
          controller.signal,
          callbacks,
        );

        fullResponse += result.content;

        if (result.content.trim() || result.toolCalls.length) {
          messages.push({
            role: "assistant",
            content: result.content,
            ...(result.toolCalls.length
              ? {
                  tool_calls: result.toolCalls.map((toolCall) => ({
                    id: toolCall.id,
                    type: "function" as const,
                    function: {
                      name: toolCall.name,
                      arguments: toolCall.arguments,
                    },
                  })),
                }
              : {}),
          });
        }

        if (!result.toolCalls.length || result.finishReason !== "tool_calls") {
          callbacks.onComplete(fullResponse.trim());
          return;
        }

        if (!hasToolCall) {
          hasToolCall = true;
          callbacks.onToolCallDetected();
        }

        for (const toolCall of result.toolCalls) {
          const toolResult = executeToolCall(toolCall, handlers);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: toolResult,
          });
        }
      }

      callbacks.onError(new Error("Max tool-call loop exceeded"));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        callbacks.onError(new Error("Request canceled"));
        return;
      }
      callbacks.onError(error as Error);
    } finally {
      isStreaming.value = false;
      if (abortController.value === controller) {
        abortController.value = null;
      }
    }
  }

  async function generateWebsite(
    formData: WebsiteFormData,
    conversationMessages: Message[],
    handlers: AgentToolHandlers,
    callbacks: AgentCallbacks,
  ) {
    await runAgentChat(conversationMessages, handlers, callbacks, {
      hiddenSystemPrompt: buildInitialTaskPrompt(formData),
    });
  }

  async function generateDescription(
    formData: WebsiteFormData,
  ): Promise<string> {
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      throw new Error("DeepSeek API key is not configured");
    }

    const prompt = `Write a one-sentence website description (max 80 chars) for topic "${formData.topic}" targeting "${formData.targetAudience || "general audience"}" in "${formData.stylePreference}" style. Return plain text only.`;

    const description = await runDescription(apiKey, prompt);
    return description || `Knowledge website about ${formData.topic}`;
  }

  async function generateProjectTitle(
    formData: WebsiteFormData,
    html = "",
  ): Promise<string> {
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      throw new Error("DeepSeek API key is not configured");
    }

    const prompt = buildProjectTitlePrompt(formData, html);
    const title = await runDescription(apiKey, prompt);
    return normalizeProjectTitle(title);
  }

  return {
    isStreaming,
    cancelCurrentResponse,
    runAgentChat,
    generateWebsite,
    generateDescription,
    generateProjectTitle,
  };
}
