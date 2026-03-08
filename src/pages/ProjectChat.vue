<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import ChatInterface from "../components/chat/ChatInterface.vue";
import { extractHtmlFromResponse, useAI } from "../composables/ai";
import { useChat } from "../composables/chat";
import { useProjects } from "../composables/projects";

const route = useRoute();
const router = useRouter();
const {
  conversations,
  updateWebsiteHtml,
  selectConversation,
  addMessage,
  setWebsiteData,
  updateConversationStatus,
} = useChat();
const { createProject, getProjectByConversationId } = useProjects();
const { generateWebsite, generateDescription } = useAI();

const conversationId = computed(() => route.params.id as string);
const isBootstrappingGeneration = ref(false);

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
  async (value) => {
    if (!value) {
      router.replace("/");
      return;
    }

    if (
      value.status === "generating" &&
      !value.website &&
      !isBootstrappingGeneration.value
    ) {
      await runInitialGeneration();
    }
  },
  { immediate: true },
);

async function runInitialGeneration() {
  const currentConversation = conversation.value;
  if (!currentConversation) return;
  if (!currentConversation.initialFormData) {
    updateConversationStatus(currentConversation.id, "creating");
    addMessage(currentConversation.id, {
      role: "assistant",
      content:
        "Error: Missing generation details. Please return to Create and submit again.",
    });
    return;
  }

  isBootstrappingGeneration.value = true;
  const formData = currentConversation.initialFormData;
  const isFirstWebsite = !currentConversation.website;

  let fullResponse = "";
  const assistantMessage = addMessage(currentConversation.id, {
    role: "assistant",
    content: "",
  });

  try {
    const websitePromise = new Promise<void>((resolve, reject) => {
      generateWebsite(formData, {
        onChunk: (chunk) => {
          fullResponse += chunk;
          if (assistantMessage) {
            assistantMessage.content += chunk;
          }
        },
        onComplete: () => resolve(),
        onError: (error) => reject(error),
      });
    });

    await websitePromise;
    const html = extractHtmlFromResponse(fullResponse);

    if (!html) {
      updateConversationStatus(currentConversation.id, "creating");
      if (assistantMessage) {
        assistantMessage.content +=
          "\n\nError: Could not extract HTML from AI response. Please try again.";
      }
      return;
    }

    if (assistantMessage) {
      assistantMessage.extractedHtml = html;
    }

    let description = `Knowledge website about ${formData.topic}`;
    try {
      description = await generateDescription(formData);
    } catch {
      // Use fallback description when short-description generation fails.
    }

    setWebsiteData(currentConversation.id, {
      name: formData.topic,
      description,
      html,
    });

    if (!getProjectByConversationId(currentConversation.id)) {
      createProject(formData.topic, description, html, currentConversation.id);
    }

    if (isFirstWebsite) {
      router.push({
        name: "ProjectPreview",
        params: { id: currentConversation.id },
      });
    }
  } catch (error) {
    updateConversationStatus(currentConversation.id, "creating");
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    if (assistantMessage) {
      assistantMessage.content = `Error: ${errorMessage}`;
    } else {
      addMessage(currentConversation.id, {
        role: "assistant",
        content: `Error: ${errorMessage}`,
      });
    }
  } finally {
    isBootstrappingGeneration.value = false;
  }
}

function handleWebsiteModified(html: string, description: string) {
  if (conversation.value) {
    updateWebsiteHtml(conversation.value.id, html, description);
  }
}

const previewUrl = ref("");

watch(
  () => conversation.value?.website?.currentHtml || "",
  (html) => {
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
    if (!html) {
      previewUrl.value = "";
      return;
    }
    const blob = new Blob([html], { type: "text/html" });
    previewUrl.value = URL.createObjectURL(blob);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
});

function goToPreview() {
  if (!conversation.value?.website?.currentHtml) return;
  router.push({
    name: "ProjectPreview",
    params: { id: conversation.value.id },
  });
}
</script>

<template>
  <div class="bg-stone-100 flex flex-col h-full dark:bg-stone-900">
    <div
      class="px-4 py-3 border-b border-stone-200 bg-stone-50 flex items-center justify-between dark:border-stone-800 dark:bg-stone-900"
    >
      <div class="flex gap-3 min-w-0 items-center">
        <RouterLink
          to="/projects"
          class="text-sm text-stone-600 font-medium flex gap-1.5 items-center dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
        >
          <div class="i-ph-arrow-left text-base" />
          Projects
        </RouterLink>
        <h1
          class="text-sm text-stone-900 font-semibold truncate dark:text-stone-100"
        >
          {{ conversation?.website?.name || conversation?.title || "Untitled" }}
        </h1>
      </div>
      <button
        class="text-xs text-stone-700 font-medium px-3 py-1.5 border border-stone-300 rounded-md flex gap-1.5 transition-colors items-center dark:text-stone-200 dark:border-stone-700 hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-stone-800"
        :disabled="!conversation?.website?.currentHtml"
        @click="goToPreview"
      >
        <div class="i-ph-eye text-sm" />
        Open Preview
      </button>
    </div>

    <div
      class="p-3 border-b border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-900"
    >
      <button
        class="border border-stone-300 rounded-md bg-white h-24 w-full transition-colors relative overflow-hidden dark:border-stone-700 hover:border-stone-500 dark:bg-stone-800 disabled:cursor-not-allowed"
        :disabled="!conversation?.website?.currentHtml"
        @click="goToPreview"
      >
        <iframe
          v-if="previewUrl"
          :src="previewUrl"
          sandbox="allow-scripts"
          title="Mini Website Preview"
          class="border-0 h-full w-full pointer-events-none"
        />
        <div
          v-else
          class="text-xs text-stone-500 flex gap-2 h-full items-center justify-center dark:text-stone-400"
        >
          <div class="i-ph-spinner text-base animate-spin" />
          Preview will appear after generation
        </div>
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
</template>
