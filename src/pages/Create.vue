<script setup lang="ts">
import { useRouter } from "vue-router";
import CreationForm from "../components/creation/CreationForm.vue";
import { useChat } from "../composables/chat";
import type { WebsiteFormData } from "../types";

const router = useRouter();
const { createConversation, updateConversationStatus } = useChat();

function handleFormSubmit(formData: WebsiteFormData) {
  const conversationId = createConversation(formData);
  updateConversationStatus(conversationId, "generating");

  // Generation now runs directly in the chat page so progress and output are visible.
  router.push({
    name: "ProjectChat",
    params: { id: conversationId },
  });
}
</script>

<template>
  <div class="py-4 h-full overflow-y-scroll">
    <CreationForm @submit="handleFormSubmit" />
  </div>
</template>
