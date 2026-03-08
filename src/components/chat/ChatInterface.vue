<script setup lang="ts">
import MarkdownRender from "markstream-vue";
import { computed, nextTick, ref, watch } from "vue";
import {
  extractHtmlFromResponse,
  toChatNarrative,
  useAI,
} from "../../composables/ai";
import { useChat } from "../../composables/chat";
import type { Conversation } from "../../types";

type AgentProcessEvent = {
  id: string;
  status: "running" | "done" | "error";
  title: string;
  detail: string;
  timestamp: number;
};

const props = defineProps<{
  conversation: Conversation | null;
}>();

const emit = defineEmits<{
  websiteModified: [html: string, description: string];
  processEvent: [event: AgentProcessEvent];
}>();

const { isStreaming, modifyWebsite } = useAI();
const { addMessage } = useChat();

const messagesContainer = ref<HTMLElement>();
const inputMessage = ref("");

const messages = computed(() => props.conversation?.messages || []);
const isGenerating = computed(
  () => props.conversation?.status === "generating",
);
const isInputDisabled = computed(
  () => isStreaming.value || !props.conversation,
);
const inputPlaceholder = computed(() => {
  if (props.conversation?.status === "generating")
    return "Agent is building your first website artifact...";
  if (!props.conversation) return "Conversation unavailable";
  return "Ask the agent to improve content, style, layout, or behavior...";
});

watch(
  () => props.conversation?.messages.length,
  () => {
    scrollToBottom();
  },
);

async function scrollToBottom() {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

async function handleSendModification() {
  const request = inputMessage.value.trim();
  const currentHtml = props.conversation?.website?.currentHtml || "";
  if (!request || !props.conversation || isStreaming.value) return;

  const conversationId = props.conversation.id;

  addMessage(conversationId, {
    role: "user",
    content: request,
  });

  inputMessage.value = "";

  const requestTime = Date.now();
  emit("processEvent", {
    id: `${conversationId}-request-${requestTime}`,
    status: "running",
    title: "Analyzing request",
    detail: request,
    timestamp: requestTime,
  });

  if (!currentHtml) {
    addMessage(conversationId, {
      role: "assistant",
      content:
        "I can chat now, but there is no website artifact yet. Wait for initial generation to complete, then I can apply your changes directly to the site.",
    });
    emit("processEvent", {
      id: `${conversationId}-request-no-artifact-${Date.now()}`,
      status: "error",
      title: "No artifact yet",
      detail: "Initial website generation is still in progress.",
      timestamp: Date.now(),
    });
    return;
  }

  const assistantMessage = addMessage(conversationId, {
    role: "assistant",
    content: "Working on your request...",
  });

  if (!assistantMessage) return;
  let fullAssistantResponse = "";

  const conversationHistory = props.conversation.messages
    .slice(0, -2)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n\n");

  emit("processEvent", {
    id: `${conversationId}-generation-${Date.now()}`,
    status: "running",
    title: "Running website update",
    detail: "Agent is preparing an updated artifact.",
    timestamp: Date.now(),
  });

  await modifyWebsite(currentHtml, request, conversationHistory, {
    onChunk: (chunk) => {
      fullAssistantResponse += chunk;
    },
    onComplete: () => {
      assistantMessage.content = toChatNarrative(fullAssistantResponse);
      emit("processEvent", {
        id: `${conversationId}-response-${Date.now()}`,
        status: "done",
        title: "Model response complete",
        detail: "Reviewing response for updated website artifact.",
        timestamp: Date.now(),
      });

      const html = extractHtmlFromResponse(fullAssistantResponse);
      if (html) {
        assistantMessage.extractedHtml = html;
        emit("websiteModified", html, request);
        emit("processEvent", {
          id: `${conversationId}-artifact-${Date.now()}`,
          status: "done",
          title: "Artifact updated",
          detail: "Website artifact was updated from this response.",
          timestamp: Date.now(),
        });
      } else {
        emit("processEvent", {
          id: `${conversationId}-artifact-none-${Date.now()}`,
          status: "done",
          title: "No artifact update",
          detail: "Assistant replied without website code changes.",
          timestamp: Date.now(),
        });
      }
    },
    onError: (error) => {
      assistantMessage.content = `Error: ${error.message}`;
      emit("processEvent", {
        id: `${conversationId}-error-${Date.now()}`,
        status: "error",
        title: "Agent request failed",
        detail: error.message,
        timestamp: Date.now(),
      });
    },
  });
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSendModification();
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Messages -->
    <div
      ref="messagesContainer"
      class="p-4 flex flex-1 flex-col gap-3 overflow-y-auto md:p-6 md:gap-4"
    >
      <div
        v-if="messages.length === 0"
        class="text-stone-500 p-8 text-center flex flex-1 flex-col items-center justify-center"
      >
        <div
          class="text-3xl text-stone-600 mb-4 rounded-2xl bg-stone-200 flex h-16 w-16 items-center justify-center dark:text-stone-300 dark:bg-stone-800"
        >
          <div class="i-ph-robot text-2xl" />
        </div>
        <h3
          class="text-lg text-stone-900 font-semibold mb-2 dark:text-stone-100"
        >
          {{ isGenerating ? "Agent Is Building" : "Agent Workspace" }}
        </h3>
        <p class="text-sm text-stone-600 dark:text-stone-400">
          {{
            isGenerating
              ? "Creating the first website artifact now."
              : "Chat with the agent. Website changes are one of several possible outputs."
          }}
        </p>
      </div>

      <template v-else>
        <div v-for="message in messages" :key="message.id" class="flex gap-3">
          <div class="flex flex-shrink-0 h-6 w-6 items-center justify-center">
            <div
              v-if="message.role === 'user'"
              class="i-ph-user text-stone-400 dark:text-stone-500"
            />
            <div v-else class="i-ph-robot text-stone-400 dark:text-stone-500" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="max-w-none prose prose-sm dark:prose-invert">
              <MarkdownRender :content="message.content" />
            </div>
            <div v-if="message.extractedHtml" class="mt-2 flex gap-2">
              <span
                class="text-xs text-stone-600 px-2 py-1 rounded bg-stone-100 flex gap-1 w-fit items-center dark:text-stone-400 dark:bg-stone-800"
              >
                <div class="i-ph-check-circle" />
                Artifact Updated
              </span>
            </div>
          </div>
        </div>

        <div v-if="isStreaming" class="p-3 flex gap-1 self-start">
          <span
            class="rounded-full bg-stone-400 h-2 w-2 animate-bounce dark:bg-stone-600"
            style="animation-delay: 0ms"
          />
          <span
            class="rounded-full bg-stone-400 h-2 w-2 animate-bounce dark:bg-stone-600"
            style="animation-delay: 150ms"
          />
          <span
            class="rounded-full bg-stone-400 h-2 w-2 animate-bounce dark:bg-stone-600"
            style="animation-delay: 300ms"
          />
        </div>
      </template>
    </div>

    <!-- Input Area -->
    <div
      class="p-3 border-t border-stone-200 bg-stone-100 md:p-4 dark:border-stone-800 dark:bg-stone-900"
    >
      <div class="mx-auto flex gap-2 max-w-full items-end md:max-w-3xl">
        <textarea
          v-model="inputMessage"
          :placeholder="inputPlaceholder"
          :disabled="isInputDisabled"
          rows="1"
          class="text-sm text-stone-900 leading-relaxed px-3.5 py-2.5 border border-stone-200 rounded-lg bg-stone-50 flex-1 max-h-[120px] min-h-[44px] resize-none transition-colors dark:text-stone-200 md:px-4 md:py-3 focus:outline-none dark:border-stone-700 focus:border-stone-500 dark:bg-stone-900 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed dark:focus:border-stone-500 dark:focus:bg-stone-800 placeholder-stone-400 dark:placeholder-stone-500"
          @keydown="handleKeydown"
        />
        <button
          class="text-lg text-white rounded-lg bg-stone-200 flex flex-shrink-0 h-11 w-11 transition-colors items-center justify-center dark:bg-stone-800 hover:bg-stone-300 disabled:opacity-50 md:h-12 md:w-12 disabled:cursor-not-allowed dark:hover:bg-stone-700"
          :disabled="isInputDisabled || !inputMessage.trim()"
          @click="handleSendModification"
        >
          <div class="i-ph-paper-plane-right text-xl" />
        </button>
      </div>
    </div>
  </div>
</template>
