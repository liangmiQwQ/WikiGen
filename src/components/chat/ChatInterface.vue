<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useAI } from "../../composables/ai";
import { useChat } from "../../composables/chat";
import ChatInput from "./ChatInput.vue";
import ChatMessage from "./ChatMessage.vue";
import type { Conversation, Message } from "../../types";

const props = defineProps<{
  conversation: Conversation | null;
}>();

const emit = defineEmits<{
  websiteModified: [html: string, description: string];
}>();

const { isStreaming, lastRunTokensUsed, runAgentChat, cancelCurrentResponse } =
  useAI();
const {
  addMessage,
  updateMessageContent,
  addToolRunMessage,
  updateToolRunStep,
  completeToolRun,
  snapshotForUserMessage,
  truncateAfterMessage,
  restoreFromSnapshot,
  getWorkspaceFile,
  setWorkspaceFile,
} = useChat();

const inputMessage = ref("");

const messages = computed(() => props.conversation?.messages || []);
const isGenerating = computed(
  () => props.conversation?.status === "generating",
);
const isInputDisabled = computed(
  () => isStreaming.value || !props.conversation,
);
const inputPlaceholder = computed(() => {
  if (props.conversation?.status === "generating") {
    return "Agent is generating your initial website...";
  }
  if (!props.conversation) return "Conversation unavailable";
  return "Ask anything, or request website changes...";
});

watch(
  () => props.conversation?.messages.length,
  () => {
    scrollToBottom();
  },
);

async function scrollToBottom() {
  await nextTick();
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: "smooth",
  });
}

async function runAssistantForConversation(conversationId: string) {
  const conversation = props.conversation;
  if (!conversation) return;

  const assistantMessage = addMessage(conversationId, {
    role: "assistant",
    content: "",
    kind: "text",
  });
  if (!assistantMessage) return;
  const modelMessages = conversation.messages.filter(
    (message) => message.id !== assistantMessage.id,
  );

  let toolRunMessageId = "";
  let lastWriteSummary = "Updated website";

  await runAgentChat(
    modelMessages,
    {
      readHtmlFile: (path) => {
        if (toolRunMessageId) {
          updateToolRunStep(conversationId, toolRunMessageId, {
            title: "Read file",
            detail: path,
            status: "done",
          });
        }
        return getWorkspaceFile(conversationId, path);
      },
      writeHtmlFile: (path, content, summary) => {
        lastWriteSummary = summary;
        setWorkspaceFile(conversationId, path, content);
        emit("websiteModified", content, summary);
        if (toolRunMessageId) {
          updateToolRunStep(conversationId, toolRunMessageId, {
            title: "Apply patch",
            detail: `${path} updated`,
            status: "done",
          });
        }
      },
      reportProgress: (stage, detail) => {
        if (!toolRunMessageId) return;
        updateToolRunStep(conversationId, toolRunMessageId, {
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
        assistantMessage.content =
          fullText ||
          (toolRunMessageId ? `Completed: ${lastWriteSummary}` : "Completed.");
        if (toolRunMessageId) {
          completeToolRun(conversationId, toolRunMessageId, "done");
        }
      },
      onError: (error) => {
        if (error.message === "Request canceled") {
          assistantMessage.content = "Generation canceled.";
          if (toolRunMessageId) {
            updateToolRunStep(conversationId, toolRunMessageId, {
              title: "Canceled",
              detail: "User canceled this run.",
              status: "error",
            });
            completeToolRun(conversationId, toolRunMessageId, "error");
          }
          return;
        }

        assistantMessage.content = `Error: ${error.message}`;
        if (toolRunMessageId) {
          updateToolRunStep(conversationId, toolRunMessageId, {
            title: "Failed",
            detail: error.message,
            status: "error",
          });
          completeToolRun(conversationId, toolRunMessageId, "error");
        }
      },
      onToolCallDetected: () => {
        if (toolRunMessageId) return;
        const toolMessage = addToolRunMessage(conversationId, "Tool Run");
        toolRunMessageId = toolMessage?.id || "";
      },
    },
  );
}

async function handleSend() {
  const request = inputMessage.value.trim();
  if (!request || !props.conversation || isStreaming.value) return;

  const conversationId = props.conversation.id;
  const userMessage = addMessage(conversationId, {
    role: "user",
    content: request,
    kind: "text",
  });

  inputMessage.value = "";

  if (!userMessage) return;
  snapshotForUserMessage(conversationId, userMessage.id);
  await runAssistantForConversation(conversationId);
}

async function saveEditAndRegenerate(message: Message, draft: string) {
  const conversation = props.conversation;
  if (!conversation || !draft || isStreaming.value) return;

  updateMessageContent(conversation.id, message.id, draft);
  restoreFromSnapshot(conversation.id, message.id);
  truncateAfterMessage(conversation.id, message.id);
  await runAssistantForConversation(conversation.id);
}

function getPreviousUserMessage(messageId: string) {
  const conversation = props.conversation;
  if (!conversation) return null;

  const currentIndex = conversation.messages.findIndex(
    (message) => message.id === messageId,
  );
  if (currentIndex <= 0) return null;

  for (let index = currentIndex - 1; index >= 0; index -= 1) {
    const message = conversation.messages[index];
    if (message.role === "user" && message.kind === "text") {
      return message;
    }
  }

  return null;
}

function canRegenerateAssistantMessage(message: Message) {
  if (message.role !== "assistant" || message.kind !== "text") return false;
  return Boolean(getPreviousUserMessage(message.id));
}

async function regenerateAssistantMessage(message: Message) {
  const conversation = props.conversation;
  if (!conversation || isStreaming.value) return;

  const previousUserMessage = getPreviousUserMessage(message.id);
  if (!previousUserMessage) return;

  restoreFromSnapshot(conversation.id, previousUserMessage.id);
  truncateAfterMessage(conversation.id, previousUserMessage.id);
  await runAssistantForConversation(conversation.id);
}
</script>

<template>
  <div class="flex flex-col w-full items-center">
    <div class="p-4 pb-32 flex flex-col max-w-3xl w-full md:p-6 md:pb-40">
      <div class="flex flex-col gap-3 w-full md:gap-4">
        <!-- Empty State -->
        <div
          v-if="messages.length === 0"
          class="text-stone-500 p-8 text-center flex flex-1 flex-col items-center justify-center"
        >
          <h3
            class="text-lg text-stone-900 font-semibold mb-2 dark:text-stone-100"
          >
            {{ isGenerating ? "Agent Is Building" : "Agent Workspace" }}
          </h3>
          <p class="text-sm text-stone-600 dark:text-stone-400">
            {{
              isGenerating
                ? "Creating the first website artifact now."
                : "Chat normally, and the AI will call tools only when website edits are needed."
            }}
          </p>
        </div>

        <!-- Message List -->
        <template v-else>
          <ChatMessage
            v-for="(message, index) in messages"
            :key="message.id"
            :message="message"
            :is-streaming="isStreaming"
            :is-streaming-this="isStreaming && index === messages.length - 1"
            :can-regenerate="canRegenerateAssistantMessage(message)"
            @regenerate="regenerateAssistantMessage"
            @save-edit="saveEditAndRegenerate"
          />
        </template>
      </div>
    </div>

    <!-- Input Bar -->
    <ChatInput
      v-model="inputMessage"
      :placeholder="inputPlaceholder"
      :disabled="!props.conversation"
      :is-streaming="isStreaming"
      :is-input-disabled="isInputDisabled"
      :tokens-used="lastRunTokensUsed"
      @send="handleSend"
      @cancel="cancelCurrentResponse"
    />
  </div>
</template>
