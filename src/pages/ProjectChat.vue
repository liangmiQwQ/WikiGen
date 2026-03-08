<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import ChatInterface from "../components/chat/ChatInterface.vue";
import { useAI } from "../composables/ai";
import { useChat } from "../composables/chat";
import { useProjects } from "../composables/projects";
import { buildInitialUserRequest } from "../prompts/agent";

const route = useRoute();
const router = useRouter();
const {
  conversations,
  updateWebsiteHtml,
  selectConversation,
  addMessage,
  snapshotForUserMessage,
  setWebsiteData,
  updateConversationStatus,
  addToolRunMessage,
  updateToolRunStep,
  completeToolRun,
  getWorkspaceFile,
  setWorkspaceFile,
} = useChat();
const { createProject, getProjectByConversationId, updateProject } =
  useProjects();
const {
  generateWebsite,
  generateDescription,
  cancelCurrentResponse,
  isStreaming,
} = useAI();

const conversationId = computed(() => route.params.id as string);
const isBootstrappingGeneration = ref(false);

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
      kind: "text",
    });
    return;
  }

  isBootstrappingGeneration.value = true;
  const formData = currentConversation.initialFormData;

  const hasInitialUserMessage = currentConversation.messages.some(
    (message) => message.role === "user" && message.kind === "text",
  );
  if (!hasInitialUserMessage) {
    const initialUserMessage = addMessage(currentConversation.id, {
      role: "user",
      content: buildInitialUserRequest(formData),
      kind: "text",
    });
    if (initialUserMessage) {
      snapshotForUserMessage(currentConversation.id, initialUserMessage.id);
    }
  }

  const assistantMessage = addMessage(currentConversation.id, {
    role: "assistant",
    content: "",
    kind: "text",
  });

  if (!assistantMessage) {
    isBootstrappingGeneration.value = false;
    return;
  }

  let toolRunMessageId = "";
  let latestHtml = "";
  let latestSummary = "Initial generation";
  const modelMessages = currentConversation.messages.filter(
    (message) => message.id !== assistantMessage.id,
  );

  try {
    await generateWebsite(
      formData,
      modelMessages,
      {
        readHtmlFile: (path) => {
          if (toolRunMessageId) {
            updateToolRunStep(currentConversation.id, toolRunMessageId, {
              title: "Read file",
              detail: path,
              status: "done",
            });
          }
          return getWorkspaceFile(currentConversation.id, path);
        },
        writeHtmlFile: (path, content, summary) => {
          latestHtml = content;
          latestSummary = summary;
          setWorkspaceFile(currentConversation.id, path, content);
          if (toolRunMessageId) {
            updateToolRunStep(currentConversation.id, toolRunMessageId, {
              title: "Apply patch",
              detail: `${path} updated`,
              status: "done",
            });
          }
        },
        reportProgress: (stage, detail) => {
          if (!toolRunMessageId) return;
          updateToolRunStep(currentConversation.id, toolRunMessageId, {
            title: stage,
            detail,
            status: "running",
          });
        },
      },
      {
        onChunk: (chunk) => {
          assistantMessage.content += chunk;
        },
        onComplete: (fullText) => {
          assistantMessage.content = fullText || "Initial website generated.";
          if (toolRunMessageId) {
            completeToolRun(currentConversation.id, toolRunMessageId, "done");
          }
        },
        onError: (error) => {
          updateConversationStatus(currentConversation.id, "creating");
          assistantMessage.content = `Error: ${error.message}`;
          if (toolRunMessageId) {
            updateToolRunStep(currentConversation.id, toolRunMessageId, {
              title: "Failed",
              detail: error.message,
              status: "error",
            });
            completeToolRun(currentConversation.id, toolRunMessageId, "error");
          }
        },
        onToolCallDetected: () => {
          if (toolRunMessageId) return;
          const toolMessage = addToolRunMessage(
            currentConversation.id,
            "Tool Run",
          );
          toolRunMessageId = toolMessage?.id || "";
        },
      },
    );

    if (!latestHtml) {
      updateConversationStatus(currentConversation.id, "creating");
      if (!assistantMessage.content.trim()) {
        assistantMessage.content =
          "No HTML was written by tools. Please ask the assistant to build the website again.";
      }
      return;
    }

    let description = `Knowledge website about ${formData.topic}`;
    try {
      description = await generateDescription(formData);
    } catch {
      // Keep fallback description.
    }

    if (currentConversation.website) {
      updateWebsiteHtml(currentConversation.id, latestHtml, latestSummary);
    } else {
      setWebsiteData(currentConversation.id, {
        name: formData.topic,
        description,
        html: latestHtml,
      });
    }

    const existingProject = getProjectByConversationId(currentConversation.id);
    if (existingProject) {
      updateProject(existingProject.id, latestHtml);
    } else {
      createProject(
        formData.topic,
        description,
        latestHtml,
        currentConversation.id,
      );
    }
  } finally {
    isBootstrappingGeneration.value = false;
  }
}

function handleWebsiteModified(html: string, description: string) {
  if (!conversation.value) return;
  updateWebsiteHtml(conversation.value.id, html, description);
  const project = getProjectByConversationId(conversation.value.id);
  if (project) {
    updateProject(project.id, html);
  }
}

const previewHtml = computed(() => {
  return (
    conversation.value?.website?.currentHtml ||
    conversation.value?.workspace.files["index.html"] ||
    ""
  );
});

function goToPreview() {
  if (!previewHtml.value) return;
  router.push({
    name: "ProjectPreview",
    params: { id: conversationId.value },
  });
}
</script>

<template>
  <div class="bg-stone-100 flex flex-col h-full relative dark:bg-stone-900">
    <div
      class="border-b bg-stone-50 relative overflow-hidden backdrop-blur-md dark:border-stone-800 dark:bg-stone-900"
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
        <div class="flex gap-2 items-center">
          <span
            class="text-xs text-stone-700 px-2.5 py-1 border border-stone-300 rounded-full bg-stone-100 dark:text-stone-300 dark:border-stone-700 dark:bg-stone-800"
          >
            {{ statusLabel }}
          </span>
          <button
            v-if="isStreaming"
            class="text-xs text-stone-700 font-medium px-2.5 py-1.5 border border-stone-300 rounded-md flex gap-1 transition-colors items-center dark:text-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-800"
            @click="cancelCurrentResponse"
          >
            <div class="i-ph-stop-circle text-sm" />
            Stop
          </button>
          <button
            class="text-xs text-stone-700 font-medium px-3 py-1.5 border border-stone-300 rounded-md flex gap-1.5 transition-colors items-center dark:text-stone-200 dark:border-stone-700 hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-stone-800"
            :disabled="!previewHtml"
            @click="goToPreview"
          >
            <div class="i-ph-arrows-out-simple text-sm" />
            Full Preview
          </button>
        </div>
      </div>
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
