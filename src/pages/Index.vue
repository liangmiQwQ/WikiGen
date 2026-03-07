<script setup lang="ts">
import { computed, ref } from "vue";
import ChatInterface from "../components/chat/ChatInterface.vue";
import CreationForm from "../components/creation/CreationForm.vue";
import WebsiteViewer from "../components/viewer/WebsiteViewer.vue";
import { useAI } from "../composables/ai";
import { useChat } from "../composables/chat";
import { useDarkTheme } from "../composables/dark-theme";
import type { WebsiteFormData } from "../types";

const { isDark } = useDarkTheme();
const {
  currentConversation,
  currentConversationId,
  createConversation,
  updateConversationStatus,
  setWebsiteData,
  updateWebsiteHtml,
  addMessage,
} = useChat();
const { generateWebsite, extractHtmlFromResponse } = useAI();

const isGenerating = ref(false);
const generationError = ref("");

const showLeftPanel = computed(() => {
  if (!currentConversation.value) return true;
  return currentConversation.value.status === "creating";
});

async function handleFormSubmit(formData: WebsiteFormData) {
  generationError.value = "";

  // Create conversation
  const conversationId = createConversation(formData);
  updateConversationStatus(conversationId, "generating");
  isGenerating.value = true;

  // Generate website
  let fullResponse = "";

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
          description: `Knowledge website about ${formData.topic} for ${formData.targetAudience}`,
          html,
        });

        updateConversationStatus(conversationId, "completed");
      } else {
        generationError.value = "Failed to extract HTML from response";
        updateConversationStatus(conversationId, "creating");
      }
      isGenerating.value = false;
    },
    onError: (error) => {
      generationError.value = error.message;
      updateConversationStatus(conversationId, "creating");
      isGenerating.value = false;
    },
  });
}

function handleModificationRequest() {
  // Modification requests are handled by ChatInterface component
}

function handleWebsiteModified(html: string, description: string) {
  if (currentConversation.value) {
    updateWebsiteHtml(currentConversation.value.id, html, description);
  }
}

function handleSwitchVersion(versionNumber: number) {
  if (!currentConversation.value?.website) return;
  const version = currentConversation.value.website.versions.find(
    (v) => v.version === versionNumber,
  );
  if (version) {
    currentConversation.value.website.currentHtml = version.html;
  }
}

function startNew() {
  currentConversationId.value = null;
}
</script>

<template>
  <div class="h-[calc(100vh-64px)] overflow-hidden">
    <!-- Error Toast -->
    <div
      v-if="generationError"
      class="text-white p-4 rounded-lg max-w-md shadow-lg right-4 top-20 fixed z-50"
      :class="isDark ? 'bg-red-900' : 'bg-red-600'"
    >
      <div class="flex gap-3 items-start">
        <div class="i ph-warning-circle text-xl" />
        <div class="flex-1">
          <p class="text-sm font-medium">Generation Failed</p>
          <p class="text-xs mt-1 opacity-90">{{ generationError }}</p>
        </div>
        <button @click="generationError = ''">
          <div class="i ph-x" />
        </button>
      </div>
    </div>

    <div class="flex flex-col h-full lg:flex-row">
      <!-- Left Panel: Form or Chat -->
      <div
        class="min-w-0 transition-all duration-300"
        :class="[
          showLeftPanel
            ? 'h-full lg:w-[45%] xl:w-[40%]'
            : 'h-0 lg:h-full lg:w-[35%] xl:w-[30%]',
        ]"
      >
        <CreationForm v-if="showLeftPanel" @submit="handleFormSubmit" />
        <ChatInterface
          v-else-if="currentConversation"
          :conversation="currentConversation"
          @website-modified="handleWebsiteModified"
        />
      </div>

      <!-- Resizer (visible when both panels shown) -->
      <div
        v-if="!showLeftPanel"
        class="flex-shrink-0 hidden lg:h-full lg:w-px lg:block"
        :class="isDark ? 'bg-stone-800' : 'bg-stone-200'"
      />

      <!-- Right Panel: Website Viewer -->
      <div
        class="flex-1 min-w-0 transition-all duration-300"
        :class="[showLeftPanel ? 'h-0 lg:h-full' : 'h-full']"
      >
        <WebsiteViewer
          v-if="currentConversation"
          :conversation="currentConversation"
          @request-modification="handleModificationRequest"
          @switch-version="handleSwitchVersion"
        />
        <div
          v-else
          class="p-8 flex flex-col h-full items-center justify-center"
          :class="
            isDark
              ? 'bg-stone-900 text-stone-500'
              : 'bg-stone-50 text-stone-400'
          "
        >
          <div
            class="text-3xl mb-4 rounded-2xl flex h-16 w-16 items-center justify-center"
            :class="isDark ? 'bg-stone-800' : 'bg-stone-200'"
          >
            <div class="i ph-plus" />
          </div>
          <p class="text-sm">Start by creating a new website</p>
        </div>
      </div>
    </div>

    <!-- New Website Button (when viewing existing) -->
    <button
      v-if="!showLeftPanel"
      class="text-sm text-white font-medium px-4 py-2 rounded-full flex gap-2 shadow-lg transition-transform items-center bottom-6 right-6 fixed hover:scale-105"
      :class="
        isDark
          ? 'bg-stone-600 hover:bg-stone-500'
          : 'bg-stone-700 hover:bg-stone-800'
      "
      @click="startNew"
    >
      <div class="i ph-plus text-lg" />
      New Website
    </button>
  </div>
</template>
