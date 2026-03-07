<script setup lang="ts">
import MarkdownRender from "markstream-vue";
import { computed, nextTick, ref, watch } from "vue";
import { extractHtmlFromResponse, useAI } from "../../composables/ai";
import { useChat } from "../../composables/chat";
import { useDarkTheme } from "../../composables/dark-theme";
import type { Conversation } from "../../types";

const props = defineProps<{
  conversation: Conversation | null;
}>();

const emit = defineEmits<{
  websiteModified: [html: string, description: string];
}>();

const { isDark } = useDarkTheme();
const { isStreaming, modifyWebsite } = useAI();
const { addMessage } = useChat();

const messagesContainer = ref<HTMLElement>();
const inputMessage = ref("");

const messages = computed(() => props.conversation?.messages || []);
const isGenerating = computed(
  () => props.conversation?.status === "generating",
);

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
        class="p-8 text-center flex flex-1 flex-col items-center justify-center"
        :class="isDark ? 'text-stone-500' : 'text-stone-500'"
      >
        <div
          class="text-3xl mb-4 rounded-2xl flex h-16 w-16 items-center justify-center"
          :class="
            isDark
              ? 'bg-stone-800 text-stone-300'
              : 'bg-stone-200 text-stone-600'
          "
        >
          <div class="i-ph-robot text-2xl" />
        </div>
        <h3
          class="text-lg font-semibold mb-2"
          :class="isDark ? 'text-stone-100' : 'text-stone-900'"
        >
          AI Agent
        </h3>
        <p
          class="text-sm"
          :class="isDark ? 'text-stone-400' : 'text-stone-600'"
        >
          Your website has been generated. You can request modifications here.
        </p>
      </div>

      <!-- Message List -->
      <template v-else>
        <div v-for="message in messages" :key="message.id" class="flex gap-3">
          <div class="flex flex-shrink-0 h-6 w-6 items-center justify-center">
            <div
              v-if="message.role === 'user'"
              class="i-ph-user"
              :class="isDark ? 'text-stone-500' : 'text-stone-400'"
            />
            <div
              v-else
              class="i ph-robot"
              :class="isDark ? 'text-stone-500' : 'text-stone-400'"
            />
          </div>
          <div class="flex-1 min-w-0">
            <div
              class="max-w-none prose prose-sm"
              :class="isDark ? 'prose-invert' : ''"
            >
              <MarkdownRender :content="message.content" />
            </div>
            <div v-if="message.extractedHtml" class="mt-2 flex gap-2">
              <span
                class="text-xs px-2 py-1 rounded flex gap-1 w-fit items-center"
                :class="
                  isDark
                    ? 'bg-stone-800 text-stone-400'
                    : 'bg-stone-100 text-stone-600'
                "
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
            class="rounded-full h-2 w-2 animate-bounce"
            :class="isDark ? 'bg-stone-600' : 'bg-stone-400'"
            style="animation-delay: 0ms"
          />
          <span
            class="rounded-full h-2 w-2 animate-bounce"
            :class="isDark ? 'bg-stone-600' : 'bg-stone-400'"
            style="animation-delay: 150ms"
          />
          <span
            class="rounded-full h-2 w-2 animate-bounce"
            :class="isDark ? 'bg-stone-600' : 'bg-stone-400'"
            style="animation-delay: 300ms"
          />
        </div>
      </template>
    </div>

    <!-- Input Area -->
    <div
      v-if="conversation?.status === 'completed'"
      class="p-3 border-t md:p-4"
      :class="
        isDark
          ? 'border-stone-800 bg-stone-900'
          : 'border-stone-200 bg-stone-100'
      "
    >
      <div class="mx-auto flex gap-2 max-w-full items-end md:max-w-3xl">
        <textarea
          v-model="inputMessage"
          placeholder="Request modifications to your website..."
          :disabled="isStreaming"
          rows="1"
          class="text-sm leading-relaxed px-3.5 py-2.5 border rounded-lg flex-1 max-h-[120px] min-h-[44px] resize-none transition-colors md:px-4 md:py-3 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
          :class="
            isDark
              ? 'border-stone-700 bg-stone-900 text-stone-200 placeholder-stone-500 focus:border-stone-500 focus:bg-stone-800'
              : 'border-stone-200 bg-stone-50 text-stone-900 placeholder-stone-400 focus:border-stone-500 focus:bg-white'
          "
          @keydown="handleKeydown"
        />
        <button
          class="text-lg text-white rounded-lg flex flex-shrink-0 h-11 w-11 transition-colors items-center justify-center md:h-12 md:w-12 disabled:cursor-not-allowed"
          :class="
            isDark
              ? 'bg-stone-800 hover:bg-stone-700 disabled:opacity-50'
              : 'bg-stone-200 hover:bg-stone-300 disabled:opacity-50'
          "
          :disabled="isStreaming || !inputMessage.trim()"
          @click="handleSendModification"
        >
          <div class="i-ph-paper-plane-right text-xl" />
        </button>
      </div>
    </div>

    <!-- Generating State -->
    <div
      v-else-if="isGenerating"
      class="p-4 text-center border-t"
      :class="
        isDark
          ? 'border-stone-800 bg-stone-900'
          : 'border-stone-200 bg-stone-100'
      "
    >
      <div
        class="text-sm flex gap-2 items-center justify-center"
        :class="isDark ? 'text-stone-400' : 'text-stone-500'"
      >
        <div class="i ph-spinner text-lg animate-spin" />
        Generating your knowledge website...
      </div>
    </div>
  </div>
</template>
