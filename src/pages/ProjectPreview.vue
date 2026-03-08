<script setup lang="ts">
import { computed, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import WebsiteViewer from "../components/viewer/WebsiteViewer.vue";
import { useChat } from "../composables/chat";

const route = useRoute();
const router = useRouter();
const { conversations, selectConversation } = useChat();

const conversationId = computed(() => route.params.id as string);

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
  <div class="bg-stone-100 flex flex-col h-full dark:bg-stone-900">
    <div
      class="bg-stone-50/85 overflow-hidden backdrop-blur-md dark:bg-stone-900/85"
    >
      <div class="px-4 py-3">
        <RouterLink
          :to="{ name: 'ProjectChat', params: { id: conversationId } }"
          class="text-sm text-stone-700 font-medium p-1.5 rounded-md flex gap-1.5 w-fit transition-colors items-center dark:text-stone-300 hover:bg-stone-200 dark:hover:text-stone-100 dark:hover:bg-stone-800"
        >
          <div class="i-ph-arrow-left text-base" />
          Back to chat
        </RouterLink>
      </div>
      <div
        class="h-6 from-stone-200/60 to-transparent bg-gradient-to-b dark:from-stone-950/70"
      />
    </div>
    <div class="flex-1 min-h-0 overflow-hidden">
      <WebsiteViewer v-if="conversation" :conversation="conversation" />
    </div>
  </div>
</template>
