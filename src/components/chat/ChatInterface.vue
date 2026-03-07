<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { useAI } from "../../composables/ai";
import { useChat } from "../../composables/chat";
import { useDarkTheme } from "../../composables/dark-theme";
import ChatInput from "./ChatInput.vue";
import ChatMessage from "./ChatMessage.vue";

const {
  currentConversation,
  addMessage,
  updateMessageContent,
  createConversation,
  extractHtmlFromMessage,
} = useChat();
const { isDark } = useDarkTheme();
const { streamChat, isStreaming } = useAI();
const messagesContainer = ref<HTMLElement>();

const messages = computed(() => currentConversation.value?.messages || []);

async function scrollToBottom() {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

async function handleSend(content: string) {
  if (!currentConversation.value) {
    createConversation();
  }

  const conversationId = currentConversation.value!.id;

  addMessage(conversationId, {
    role: "user",
    content,
  });

  await scrollToBottom();

  const assistantMessage = addMessage(conversationId, {
    role: "assistant",
    content: "",
  });

  if (!assistantMessage) return;

  await streamChat(content, {
    onChunk: (chunk) => {
      updateMessageContent(
        conversationId,
        assistantMessage.id,
        assistantMessage.content + chunk,
      );
      scrollToBottom();
    },
    onComplete: () => {
      extractHtmlFromMessage(conversationId, assistantMessage.id);
    },
    onError: (error) => {
      updateMessageContent(
        conversationId,
        assistantMessage.id,
        `Error: ${error.message}`,
      );
    },
  });

  await scrollToBottom();
}
</script>

<template>
  <div
    class="flex flex-col h-full"
    :class="isDark ? 'bg-stone-900' : 'bg-stone-50'"
  >
    <div
      ref="messagesContainer"
      class="p-4 flex flex-1 flex-col gap-3 overflow-y-auto md:p-6 md:gap-4"
    >
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
          <div class="i-ph-chat-dots text-2xl" />
        </div>
        <h3
          class="text-lg font-semibold mb-2"
          :class="isDark ? 'text-stone-100' : 'text-stone-900'"
        >
          Start a conversation
        </h3>
        <p
          class="text-sm"
          :class="isDark ? 'text-stone-400' : 'text-stone-600'"
        >
          Ask me to create a website for you!
        </p>
      </div>
      <ChatMessage
        v-for="message in messages"
        :key="message.id"
        :message="message"
      />
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
    </div>
    <ChatInput :disabled="isStreaming" @send="handleSend" />
  </div>
</template>
