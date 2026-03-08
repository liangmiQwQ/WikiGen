<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import ChatInterface from "../components/chat/ChatInterface.vue";
import {
  extractHtmlFromResponse,
  toChatNarrative,
  useAI,
} from "../composables/ai";
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
const isFloatingPreviewOpen = ref(false);

const conversation = computed(() => {
  return conversations.value.find((c) => c.id === conversationId.value) || null;
});

const statusLabel = computed(() => {
  if (conversation.value?.status === "generating") return "Generating";
  if (conversation.value?.status === "completed") return "Ready";
  return "Draft";
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

  let fullResponse = "";
  const assistantMessage = addMessage(currentConversation.id, {
    role: "assistant",
    content:
      "好的，我们来创建网站。先确认目标和结构，然后我会给出可直接运行的网站版本。",
  });

  try {
    const websitePromise = new Promise<void>((resolve, reject) => {
      generateWebsite(formData, {
        onChunk: (chunk) => {
          fullResponse += chunk;
        },
        onComplete: () => resolve(),
        onError: (error) => reject(error),
      });
    });

    await websitePromise;

    if (assistantMessage) {
      assistantMessage.content = toChatNarrative(fullResponse);
    }

    const html = extractHtmlFromResponse(fullResponse);

    if (!html) {
      updateConversationStatus(currentConversation.id, "creating");
      if (assistantMessage) {
        assistantMessage.content +=
          "\n\nError: Could not extract HTML from AI response. Please try again.";
      }
      return;
    }

    if (assistantMessage) assistantMessage.extractedHtml = html;

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

    isFloatingPreviewOpen.value = true;
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
  if (!conversation.value) return;
  updateWebsiteHtml(conversation.value.id, html, description);
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
          class="text-stone-600 p-1.5 rounded-md flex transition-colors items-center dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800"
        >
          <div class="i-ph-arrow-left text-base" />
        </RouterLink>
        <h1
          class="text-sm text-stone-900 font-semibold truncate dark:text-stone-100"
        >
          {{ conversation?.website?.name || conversation?.title || "Untitled" }}
        </h1>
      </div>
      <div class="flex gap-2 items-center">
        <span
          class="text-xs text-stone-700 px-2.5 py-1 border border-stone-300 rounded-full bg-stone-100 dark:text-stone-300 dark:border-stone-700 dark:bg-stone-800"
        >
          {{ statusLabel }}
        </span>
        <button
          class="text-xs text-stone-700 font-medium px-3 py-1.5 border border-stone-300 rounded-md flex gap-1.5 transition-colors items-center dark:text-stone-200 dark:border-stone-700 hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-stone-800"
          :disabled="!conversation?.website?.currentHtml"
          @click="goToPreview"
        >
          <div class="i-ph-arrows-out-simple text-sm" />
          Full Preview
        </button>
      </div>
    </div>

    <div class="flex-1 min-h-0">
      <ChatInterface
        v-if="conversation"
        :conversation="conversation"
        @website-modified="handleWebsiteModified"
      />
    </div>

    <button
      v-if="previewUrl && !isFloatingPreviewOpen"
      class="text-sm text-white px-3 py-2 rounded-lg bg-stone-700 flex gap-2 shadow-lg items-center bottom-4 right-4 fixed z-40 dark:bg-stone-600 hover:bg-stone-800 dark:hover:bg-stone-500"
      @click="isFloatingPreviewOpen = true"
    >
      <div class="i-ph-globe text-base" />
      Open Website
    </button>

    <div
      v-if="previewUrl && isFloatingPreviewOpen"
      class="border border-stone-300 rounded-xl bg-white w-[min(92vw,460px)] shadow-2xl bottom-4 right-4 fixed z-40 overflow-hidden dark:border-stone-700 dark:bg-stone-900"
    >
      <div
        class="px-3 py-2 border-b border-stone-200 bg-stone-100 flex items-center justify-between dark:border-stone-800 dark:bg-stone-800"
      >
        <div
          class="text-sm text-stone-800 font-medium flex gap-1.5 items-center dark:text-stone-100"
        >
          <div class="i-ph-globe text-base" />
          Live Website
        </div>
        <div class="flex gap-1 items-center">
          <button
            class="text-xs text-stone-600 px-2 py-1 rounded dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
            @click="goToPreview"
          >
            Full
          </button>
          <button
            class="text-stone-600 p-1.5 rounded dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
            @click="isFloatingPreviewOpen = false"
          >
            <div class="i-ph-x text-base" />
          </button>
        </div>
      </div>

      <iframe
        :src="previewUrl"
        sandbox="allow-scripts"
        title="Floating Website Preview"
        class="border-0 h-[320px] w-full"
      />
    </div>
  </div>
</template>
