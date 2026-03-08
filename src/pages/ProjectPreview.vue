<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import WebsiteViewer from "../components/viewer/WebsiteViewer.vue";
import { useChat } from "../composables/chat";

const route = useRoute();
const router = useRouter();
const { conversations, selectConversation } = useChat();

const conversationId = computed(() => route.params.id as string);
const activeTab = ref<"preview" | "code">("preview");

const conversation = computed(() => {
  return conversations.value.find((c) => c.id === conversationId.value) || null;
});

watch(
  conversationId,
  (id) => {
    selectConversation(id);
  },
  { immediate: true },
);

watch(
  conversation,
  (value) => {
    if (!value) {
      router.replace("/");
    }
  },
  { immediate: true },
);
</script>

<template>
  <div
    class="bg-stone-100 flex flex-col min-h-screen relative dark:bg-stone-900"
  >
    <div
      class="border-b bg-stone-50/80 top-0 relative sticky z-20 overflow-hidden backdrop-blur-md dark:border-stone-800 dark:bg-stone-900/80"
    >
      <div class="px-4 py-3 flex items-center justify-between">
        <div class="flex gap-3 min-w-0 items-center">
          <RouterLink
            to="/projects"
            class="text-stone-600 p-1.5 rounded-md flex transition-colors items-center dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800"
          >
            <div class="i-ph-arrow-left text-base" />
          </RouterLink>
          <h1
            class="text-sm text-stone-900 font-semibold truncate dark:text-stone-100"
          >
            {{
              conversation?.website?.name || conversation?.title || "Untitled"
            }}
          </h1>
        </div>
        <div class="flex gap-3 items-center">
          <div class="flex gap-1">
            <RouterLink
              :to="{ name: 'ProjectChat', params: { id: conversationId } }"
              class="text-xs text-stone-700 font-medium px-3 py-1.5 border border-stone-300 rounded-md flex gap-1.5 transition-colors items-center dark:text-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-800"
            >
              <div class="i-ph-chat-circle text-sm" />
              Chat
            </RouterLink>
            <button
              class="text-xs text-stone-900 font-medium px-3 py-1.5 border border-stone-900 rounded-md bg-stone-100 flex gap-1.5 transition-colors items-center dark:text-stone-100 dark:border-stone-100 dark:bg-stone-800"
              disabled
            >
              <div class="i-ph-eye text-sm" />
              Preview
            </button>
          </div>

          <div class="bg-stone-300 h-5 w-px dark:bg-stone-700" />

          <div
            class="p-1 rounded-lg bg-stone-200/50 flex gap-1 dark:bg-stone-800/50"
          >
            <button
              class="text-xs font-medium px-2.5 py-1 rounded-md flex gap-1.5 transition-colors items-center"
              :class="
                activeTab === 'preview'
                  ? 'bg-white text-stone-800 shadow-sm dark:bg-stone-700 dark:text-stone-200'
                  : 'text-stone-500 hover:bg-stone-200/50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-700/50 dark:hover:text-stone-300'
              "
              @click="activeTab = 'preview'"
            >
              <div class="i-ph-eye text-sm" />
              <span class="hidden sm:inline">View</span>
            </button>
            <button
              class="text-xs font-medium px-2.5 py-1 rounded-md flex gap-1.5 transition-colors items-center"
              :class="
                activeTab === 'code'
                  ? 'bg-white text-stone-800 shadow-sm dark:bg-stone-700 dark:text-stone-200'
                  : 'text-stone-500 hover:bg-stone-200/50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-700/50 dark:hover:text-stone-300'
              "
              @click="activeTab = 'code'"
            >
              <div class="i-ph-code text-sm" />
              <span class="hidden sm:inline">Code</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-1 flex-col overflow-hidden">
      <WebsiteViewer
        v-if="conversation"
        :conversation="conversation"
        :active-tab="activeTab"
      />
    </div>
  </div>
</template>
