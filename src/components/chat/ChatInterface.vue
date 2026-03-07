<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { useAI } from "../../composables/use-ai";
import { useChat } from "../../composables/use-chat";
import ChatInput from "./ChatInput.vue";
import ChatMessage from "./ChatMessage.vue";

const {
  currentConversation,
  addMessage,
  updateMessageContent,
  createConversation,
  extractHtmlFromMessage,
} = useChat();
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
  <div class="bg-gray-50 flex flex-col h-full">
    <div
      ref="messagesContainer"
      class="p-4 flex flex-1 flex-col gap-3 overflow-y-auto md:p-6 md:gap-4"
    >
      <div
        v-if="messages.length === 0"
        class="text-gray-500 p-8 text-center flex flex-1 flex-col items-center justify-center"
      >
        <div
          class="text-3xl text-indigo-600 mb-4 rounded-2xl bg-indigo-100 flex h-16 w-16 items-center justify-center"
        >
          <div class="i-ph-chat-dots text-2xl" />
        </div>
        <h3 class="text-lg text-gray-900 font-semibold mb-2">
          Start a conversation
        </h3>
        <p class="text-sm">Ask me to create a website for you!</p>
      </div>
      <ChatMessage
        v-for="message in messages"
        :key="message.id"
        :message="message"
      />
      <div v-if="isStreaming" class="p-3 flex gap-1 self-start">
        <span
          class="rounded-full bg-gray-300 h-2 w-2 animate-bounce"
          style="animation-delay: 0ms"
        />
        <span
          class="rounded-full bg-gray-300 h-2 w-2 animate-bounce"
          style="animation-delay: 150ms"
        />
        <span
          class="rounded-full bg-gray-300 h-2 w-2 animate-bounce"
          style="animation-delay: 300ms"
        />
      </div>
    </div>
    <ChatInput :disabled="isStreaming" @send="handleSend" />
  </div>
</template>
