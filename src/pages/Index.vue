<script setup lang="ts">
import { computed } from "vue";
import ChatInterface from "../components/chat/ChatInterface.vue";
import WebsitePreview from "../components/preview/WebsitePreview.vue";
import { useChat } from "../composables/chat";
import { useSettings } from "../composables/settings";

const { currentConversation, createConversation, currentConversationId } =
  useChat();
const { settings } = useSettings();

const messages = computed(() => currentConversation.value?.messages || []);
const isDark = computed(() => settings.value.theme === "dark");

if (!currentConversationId.value) {
  createConversation();
}
</script>

<template>
  <div class="h-[calc(100vh-64px)] overflow-hidden">
    <div class="flex flex-col h-full lg:flex-row">
      <div class="flex-1 h-1/2 min-w-0 lg:h-full lg:max-w-[60%]">
        <ChatInterface />
      </div>
      <div
        class="flex-shrink-0 h-px lg:h-full lg:w-px"
        :class="isDark ? 'bg-stone-800' : 'bg-stone-200'"
      />
      <div class="flex-1 h-1/2 min-w-0 lg:h-full">
        <WebsitePreview :messages="messages" />
      </div>
    </div>
  </div>
</template>
