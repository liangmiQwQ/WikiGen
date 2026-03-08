<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import CreationForm from "../components/creation/CreationForm.vue";
import { useAI } from "../composables/ai";
import { useChat } from "../composables/chat";
import type { WebsiteFormData } from "../types";

const router = useRouter();
const {
  createConversation,
  updateConversationStatus,
  setWebsiteData,
  addMessage,
} = useChat();
const { generateWebsite, extractHtmlFromResponse } = useAI();

const isGenerating = ref(false);
const generationError = ref("");

async function handleFormSubmit(formData: WebsiteFormData) {
  generationError.value = "";

  // Create conversation
  const conversationId = createConversation(formData);
  updateConversationStatus(conversationId, "generating");

  // Navigate to generating page
  router.push({
    name: "Generating",
    params: { id: conversationId },
    query: { topic: formData.topic },
  });

  // Generate website
  let fullResponse = "";

  try {
    await generateWebsite(formData, {
      onChunk: (chunk) => {
        fullResponse += chunk;
      },
      onComplete: () => {
        const html = extractHtmlFromResponse(fullResponse);
        if (html) {
          // Add the generation as a message
          addMessage(conversationId, {
            role: "assistant",
            content: fullResponse,
            extractedHtml: html,
          });

          // Set website data
          setWebsiteData(conversationId, {
            name: formData.topic,
            description: `Knowledge website about ${formData.topic}`,
            html,
          });

          updateConversationStatus(conversationId, "completed");

          // Navigate to preview page
          router.push({
            name: "Preview",
            params: { id: conversationId },
          });
        } else {
          generationError.value = "Failed to extract HTML from response";
          updateConversationStatus(conversationId, "creating");
          isGenerating.value = false;
        }
      },
      onError: (error) => {
        generationError.value = error.message;
        updateConversationStatus(conversationId, "creating");
        isGenerating.value = false;
      },
    });
  } catch (error) {
    generationError.value =
      error instanceof Error ? error.message : "Unknown error";
    updateConversationStatus(conversationId, "creating");
    isGenerating.value = false;
  }
}
</script>

<template>
  <div class="py-4 h-full overflow-y-scroll">
    <!-- Error Toast -->
    <div
      v-if="generationError"
      class="text-white p-4 rounded-lg bg-red-600 max-w-md shadow-lg right-4 top-20 fixed z-50 dark:bg-red-900"
    >
      <div class="flex gap-3 items-start">
        <div class="i-ph-warning-circle text-xl" />
        <div class="flex-1">
          <p class="text-sm font-medium">Generation Failed</p>
          <p class="text-xs mt-1 opacity-90">{{ generationError }}</p>
        </div>
        <button @click="generationError = ''">
          <div class="i-ph-x" />
        </button>
      </div>
    </div>

    <CreationForm @submit="handleFormSubmit" />
  </div>
</template>
