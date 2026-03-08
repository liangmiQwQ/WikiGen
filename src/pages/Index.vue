<script setup lang="ts">
import { computed, ref } from "vue";
import ChatInterface from "../components/chat/ChatInterface.vue";
import CreationForm from "../components/creation/CreationForm.vue";
import WebsiteViewer from "../components/viewer/WebsiteViewer.vue";
import { useAI } from "../composables/ai";
import { useChat } from "../composables/chat";
import type { WebsiteFormData } from "../types";
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
const generationProgress = ref(0);
const showChat = ref(false);

const hasWebsite = computed(() => !!currentConversation.value?.website);

const viewMode = computed<"form" | "generating" | "preview">(() => {
  if (isGenerating.value) return "generating";
  if (hasWebsite.value) return "preview";
  return "form";
});

async function handleFormSubmit(formData: WebsiteFormData) {
  generationError.value = "";
  generationProgress.value = 0;

  // Create conversation
  const conversationId = createConversation(formData);
  updateConversationStatus(conversationId, "generating");
  isGenerating.value = true;

  // Simulate progress while generating
  const progressInterval = setInterval(() => {
    if (generationProgress.value < 90) {
      generationProgress.value += Math.random() * 15;
      if (generationProgress.value > 90) generationProgress.value = 90;
    }
  }, 500);

  // Generate website
  let fullResponse = "";

  await generateWebsite(formData, {
    onChunk: (chunk) => {
      fullResponse += chunk;
    },
    onComplete: () => {
      clearInterval(progressInterval);
      generationProgress.value = 100;

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
        isGenerating.value = false;
      }

      // Small delay before hiding the generating screen
      setTimeout(() => {
        isGenerating.value = false;
      }, 500);
    },
    onError: (error) => {
      clearInterval(progressInterval);
      generationError.value = error.message;
      updateConversationStatus(conversationId, "creating");
      isGenerating.value = false;
    },
  });
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
  showChat.value = false;
}

function toggleChat() {
  showChat.value = !showChat.value;
}
</script>

<template>
  <div class="h-full overflow-hidden">
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

    <!-- View: Form -->
    <div v-if="viewMode === 'form'" py-4 h-full overflow-y-scroll>
      <CreationForm @submit="handleFormSubmit" />
    </div>

    <!-- View: Generating with Progress Bar -->
    <div
      v-else-if="viewMode === 'generating'"
      class="p-8 bg-stone-100 flex flex-col h-full items-center justify-center dark:bg-stone-900"
    >
      <div class="mx-auto text-center max-w-md w-full">
        <div
          class="text-4xl text-stone-600 mx-auto mb-6 rounded-2xl bg-stone-200 flex h-20 w-20 items-center justify-center animate-pulse dark:text-stone-300 dark:bg-stone-800"
        >
          <div class="i-ph-magic-wand text-3xl" />
        </div>

        <h2 class="text-2xl text-stone-900 font-bold mb-2 dark:text-stone-100">
          Creating Your Website
        </h2>

        <p class="text-sm text-stone-600 mb-8 dark:text-stone-400">
          Our AI is crafting a beautiful knowledge website for you...
        </p>

        <!-- Progress Bar -->
        <div class="mb-4 w-full">
          <div
            class="rounded-full bg-stone-100 h-2 w-full overflow-hidden dark:bg-stone-800"
          >
            <div
              class="rounded-full bg-stone-600 h-full transition-all duration-300 ease-out dark:bg-stone-500"
              :style="{ width: `${Math.min(generationProgress, 100)}%` }"
            />
          </div>
        </div>

        <p class="text-xs text-stone-400 dark:text-stone-500">
          {{ Math.round(Math.min(generationProgress, 100)) }}% complete
        </p>

        <!-- Animated steps -->
        <div class="mt-8 flex gap-2 justify-center">
          <span
            class="rounded-full bg-stone-400 h-2 w-2 animate-bounce dark:bg-stone-600"
            style="animation-delay: 0ms"
          />
          <span
            class="rounded-full bg-stone-400 h-2 w-2 animate-bounce dark:bg-stone-600"
            style="animation-delay: 150ms"
          />
          <span
            class="rounded-full bg-stone-400 h-2 w-2 animate-bounce dark:bg-stone-600"
            style="animation-delay: 300ms"
          />
        </div>
      </div>
    </div>

    <!-- View: Preview (Single Page) -->
    <div v-else-if="viewMode === 'preview'" class="flex flex-col h-full">
      <!-- Top Bar with Actions -->
      <div
        class="px-4 py-3 border-b border-stone-200 bg-stone-100 flex flex-shrink-0 items-center justify-between dark:border-stone-800 dark:bg-stone-900/50"
      >
        <div class="flex gap-3 items-center">
          <h1
            class="text-base text-stone-800 font-semibold dark:text-stone-200"
          >
            {{ currentConversation?.website?.name }}
          </h1>
          <span
            v-if="currentConversation?.website?.versions.length"
            class="text-xs text-stone-600 px-2 py-1 rounded bg-stone-100 dark:text-stone-400 dark:bg-stone-800"
          >
            v{{ currentConversation.website.versions.length }}
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
              v-if="currentConversation"
              :conversation="currentConversation"
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
                  v-if="currentConversation"
                  :conversation="currentConversation"
                  @website-modified="handleWebsiteModified"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
