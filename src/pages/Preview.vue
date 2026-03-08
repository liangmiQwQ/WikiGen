<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import ChatInterface from "../components/chat/ChatInterface.vue";
import WebsiteViewer from "../components/viewer/WebsiteViewer.vue";
import { useChat } from "../composables/chat";

const route = useRoute();
const router = useRouter();
const { conversations, updateWebsiteHtml, selectConversation } = useChat();

const showChat = ref(false);
const conversationId = computed(() => route.params.id as string);

const conversation = computed(() => {
  return conversations.value.find((c) => c.id === conversationId.value) || null;
});

// Select this conversation when entering the page
selectConversation(conversationId.value);

function handleWebsiteModified(html: string, description: string) {
  if (conversation.value) {
    updateWebsiteHtml(conversation.value.id, html, description);
  }
}

function handleSwitchVersion(versionNumber: number) {
  if (!conversation.value?.website) return;
  const version = conversation.value.website.versions.find(
    (v) => v.version === versionNumber,
  );
  if (version) {
    conversation.value.website.currentHtml = version.html;
  }
}

function startNew() {
  router.push("/");
}

function toggleChat() {
  showChat.value = !showChat.value;
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Top Bar with Actions -->
    <div
      class="px-4 py-3 border-b border-stone-200 bg-stone-100 flex flex-shrink-0 items-center justify-between dark:border-stone-800 dark:bg-stone-900/50"
    >
      <div class="flex gap-3 items-center">
        <h1 class="text-base text-stone-800 font-semibold dark:text-stone-200">
          {{ conversation?.website?.name || "Untitled" }}
        </h1>
        <span
          v-if="conversation?.website?.versions.length"
          class="text-xs text-stone-600 px-2 py-1 rounded bg-stone-100 dark:text-stone-400 dark:bg-stone-800"
        >
          v{{ conversation.website.versions.length }}
        </span>
      </div>

      <div class="flex gap-2 items-center">
        <button
          class="text-sm font-medium px-3 py-2 rounded-md flex gap-1.5 items-center"
          :class="
            showChat
              ? 'bg-stone-200 text-stone-800 shadow-sm dark:bg-stone-800 dark:text-stone-200'
              : 'text-stone-600 hover:bg-stone-200 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-300'
          "
          @click="toggleChat"
        >
          <div
            :class="showChat ? 'i-ph-chat-circle-text' : 'i-ph-chat'"
            class="text-base"
          />
          <span class="hidden sm:inline">
            {{ showChat ? "Hide Chat" : "Edit" }}
          </span>
        </button>

        <button
          class="text-sm text-stone-600 font-medium px-3 py-2 rounded-md flex gap-1.5 items-center dark:text-stone-400 hover:text-stone-900 hover:bg-stone-200 dark:hover:text-stone-300 dark:hover:bg-stone-800"
          @click="startNew"
        >
          <div class="i-ph-plus text-base" />
          <span class="hidden sm:inline">New</span>
        </button>
      </div>
    </div>

    <!-- Content Area -->
    <div class="flex-1 min-h-0 overflow-hidden">
      <div class="flex h-full">
        <!-- Main Preview -->
        <div
          class="flex-1 min-w-0 transition-all duration-300"
          :class="showChat ? 'hidden lg:block lg:w-2/3' : 'w-full'"
        >
          <WebsiteViewer
            v-if="conversation"
            :conversation="conversation"
            @request-modification="toggleChat"
            @switch-version="handleSwitchVersion"
          />
        </div>

        <!-- Chat Panel (conditionally shown) -->
        <div
          v-if="showChat"
          class="border-stone-200 flex-shrink-0 h-full w-full lg:border-l dark:border-stone-800 lg:max-w-md lg:w-1/3"
        >
          <div class="flex flex-col h-full">
            <div
              class="px-4 py-3 border-b border-stone-200 bg-stone-100 flex flex-shrink-0 items-center justify-between dark:border-stone-800 dark:bg-stone-900/50 lg:hidden"
            >
              <span
                class="text-sm text-stone-800 font-medium dark:text-stone-200"
              >
                Chat
              </span>
              <button
                class="text-stone-600 p-1 rounded dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800"
                @click="showChat = false"
              >
                <div class="i-ph-x text-lg" />
              </button>
            </div>
            <div class="flex-1 min-h-0">
              <ChatInterface
                v-if="conversation"
                :conversation="conversation"
                @website-modified="handleWebsiteModified"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
