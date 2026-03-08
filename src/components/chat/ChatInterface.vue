<script setup lang="ts">
import MarkdownRender from "markstream-vue";
import { computed, nextTick, ref, watch } from "vue";
import { extractHtmlFromResponse, useAI } from "../../composables/ai";
import { useChat } from "../../composables/chat";
import type { Conversation } from "../../types";

const props = defineProps<{
  conversation: Conversation | null;
}>();

const emit = defineEmits<{
  websiteModified: [html: string, description: string];
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
  () => isStreaming.value || props.conversation?.status !== "completed",
);
const inputPlaceholder = computed(() => {
  if (props.conversation?.status === "generating")
    return "Generating website... chat input will unlock when done";
  if (props.conversation?.status !== "completed")
    return "Chat is currently unavailable";
  return "Request modifications to your website...";
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
  const content = inputMessage.value.trim();
  if (!content || !props.conversation?.website || isStreaming.value) return;

  const currentHtml = props.conversation.website.currentHtml;
  const conversationId = props.conversation.id;

  // Add user message using composable
  addMessage(conversationId, {
    role: "user",
    content,
  });

  inputMessage.value = "";

  // Add placeholder for assistant response
  const assistantMessage = addMessage(conversationId, {
    role: "assistant",
    content: "",
  });

  if (!assistantMessage) return;

  // Build conversation history
  const conversationHistory = props.conversation.messages
    .slice(0, -2)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n\n");

  // Stream the modification
  await modifyWebsite(currentHtml, content, conversationHistory, {
    onChunk: (chunk) => {
      assistantMessage.content += chunk;
    },
    onComplete: () => {
      const html = extractHtmlFromResponse(assistantMessage.content);
      if (html) {
        assistantMessage.extractedHtml = html;
        emit("websiteModified", html, content);
      }
    },
    onError: (error) => {
      assistantMessage.content = `Error: ${error.message}`;
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
      <!-- Empty State -->
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
          {{ isGenerating ? "Generating Website" : "AI Agent" }}
        </h3>
        <p class="text-sm text-stone-600 dark:text-stone-400">
          {{
            isGenerating
              ? "Creating your first website now. You can start editing once generation finishes."
              : "Your website has been generated. You can request modifications here."
          }}
        </p>
      </div>

      <!-- Message List -->
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
                HTML Updated
              </span>
            </div>
          </div>
        </div>

        <!-- Loading Indicator -->
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
