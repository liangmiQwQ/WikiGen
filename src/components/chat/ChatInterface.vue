<script setup lang="ts">
import MarkdownRender from "markstream-vue";
import { computed, nextTick, ref, watch } from "vue";
import { useAI } from "../../composables/ai";
import { useChat } from "../../composables/chat";
import type { Conversation, Message } from "../../types";

const props = defineProps<{
  conversation: Conversation | null;
}>();

const emit = defineEmits<{
  websiteModified: [html: string, description: string];
}>();

const { isStreaming, runAgentChat, cancelCurrentResponse } = useAI();
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

const messagesContainer = ref<HTMLElement>();
const inputMessage = ref("");
const editingMessageId = ref<string | null>(null);
const editingDraft = ref("");

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
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
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

function startEditing(message: Message) {
  if (isStreaming.value || message.role !== "user") return;
  editingMessageId.value = message.id;
  editingDraft.value = message.content;
}

function cancelEditing() {
  editingMessageId.value = null;
  editingDraft.value = "";
}

async function saveEditAndRegenerate(message: Message) {
  const conversation = props.conversation;
  const draft = editingDraft.value.trim();
  if (!conversation || !draft || isStreaming.value) return;

  updateMessageContent(conversation.id, message.id, draft);
  restoreFromSnapshot(conversation.id, message.id);
  truncateAfterMessage(conversation.id, message.id);
  cancelEditing();
  await runAssistantForConversation(conversation.id);
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div
      ref="messagesContainer"
      class="p-4 flex flex-1 flex-col gap-3 overflow-y-auto md:p-6 md:gap-4"
    >
      <div
        v-if="messages.length === 0"
        class="text-stone-500 p-8 text-center flex flex-1 flex-col items-center justify-center"
      >
        <div
          class="text-3xl text-stone-600 mb-4 rounded-2xl bg-stone-200 flex h-16 w-16 items-center justify-center dark:text-stone-300 dark:bg-stone-800"
        >
          <div class="i-ph-robot text-2xl" />
        </div>
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

      <template v-else>
        <div
          v-for="message in messages"
          :key="message.id"
          class="flex gap-3"
          :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            v-if="message.role === 'assistant'"
            class="flex flex-shrink-0 h-6 w-6 items-center justify-center"
          >
            <div class="i-ph-robot text-stone-400 dark:text-stone-500" />
          </div>

          <div
            class="min-w-0"
            :class="
              message.role === 'assistant'
                ? 'max-w-[min(100%,56rem)]'
                : 'max-w-[min(100%,48rem)]'
            "
          >
            <template v-if="message.kind === 'tool-run' && message.toolRun">
              <div
                class="p-3 border border-stone-200 rounded-xl bg-stone-50 dark:border-stone-700 dark:bg-stone-800"
              >
                <div class="mb-2 flex items-center justify-between">
                  <div
                    class="text-sm text-stone-800 font-medium dark:text-stone-100"
                  >
                    {{ message.toolRun.title }}
                  </div>
                  <span
                    class="text-xs px-2 py-0.5 rounded-full"
                    :class="
                      message.toolRun.status === 'done'
                        ? 'bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-200'
                        : message.toolRun.status === 'error'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                          : 'bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-200'
                    "
                  >
                    {{ message.toolRun.status }}
                  </span>
                </div>
                <div class="space-y-1">
                  <div
                    v-for="step in message.toolRun.steps"
                    :key="step.id"
                    class="text-xs flex gap-2 items-start"
                  >
                    <div
                      class="mt-0.5 rounded-full flex-shrink-0 h-2.5 w-2.5"
                      :class="
                        step.status === 'done'
                          ? 'bg-stone-500'
                          : step.status === 'error'
                            ? 'bg-red-500'
                            : 'bg-stone-400'
                      "
                    />
                    <div class="min-w-0">
                      <div
                        class="text-stone-700 font-medium dark:text-stone-200"
                      >
                        {{ step.title }}
                      </div>
                      <div class="text-stone-500 truncate dark:text-stone-400">
                        {{ step.detail }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <template v-else>
              <div
                class="px-4 py-3 rounded-xl"
                :class="
                  message.role === 'user'
                    ? 'bg-stone-200 text-stone-900 dark:bg-stone-700 dark:text-stone-100'
                    : 'bg-transparent text-stone-900 dark:text-stone-100'
                "
              >
                <template v-if="editingMessageId === message.id">
                  <textarea
                    v-model="editingDraft"
                    rows="3"
                    class="text-sm text-stone-900 px-3 py-2 border border-stone-300 rounded-lg bg-white w-full resize-y dark:text-stone-100 focus:outline-none dark:border-stone-600 focus:border-stone-500 dark:bg-stone-900"
                  />
                  <div class="mt-2 flex gap-2 justify-end">
                    <button
                      class="text-xs text-stone-700 px-3 py-1.5 rounded-md bg-stone-100 dark:text-stone-300 dark:bg-stone-800"
                      @click="cancelEditing"
                    >
                      Cancel
                    </button>
                    <button
                      class="text-xs text-white px-3 py-1.5 rounded-md bg-stone-700 dark:bg-stone-600"
                      @click="saveEditAndRegenerate(message)"
                    >
                      Save & Regenerate
                    </button>
                  </div>
                </template>
                <template v-else>
                  <div class="max-w-none prose prose-sm dark:prose-invert">
                    <MarkdownRender :content="message.content" />
                  </div>
                </template>
              </div>

              <div
                v-if="
                  message.role === 'user' && editingMessageId !== message.id
                "
                class="mt-1 flex justify-end"
              >
                <button
                  class="text-xs text-stone-500 px-2 py-1 rounded-md flex gap-1 transition-colors items-center dark:text-stone-400 hover:text-stone-700 hover:bg-stone-200 dark:hover:text-stone-200 dark:hover:bg-stone-800"
                  :disabled="isStreaming"
                  @click="startEditing(message)"
                >
                  <div class="i-ph-pencil-simple-line text-sm" />
                  Edit & Regenerate
                </button>
              </div>
            </template>
          </div>

          <div
            v-if="message.role === 'user'"
            class="flex flex-shrink-0 h-6 w-6 items-center justify-center"
          >
            <div class="i-ph-user text-stone-400 dark:text-stone-500" />
          </div>
        </div>

        <div v-if="isStreaming" class="p-3 self-start">
          <span
            class="rounded-full bg-stone-400 h-2 w-2 inline-block animate-bounce dark:bg-stone-600"
            style="animation-delay: 0ms"
          />
          <span
            class="ml-1 rounded-full bg-stone-400 h-2 w-2 inline-block animate-bounce dark:bg-stone-600"
            style="animation-delay: 150ms"
          />
          <span
            class="ml-1 rounded-full bg-stone-400 h-2 w-2 inline-block animate-bounce dark:bg-stone-600"
            style="animation-delay: 300ms"
          />
        </div>
      </template>
    </div>

    <div
      class="p-3 border-t border-stone-200 bg-stone-100 md:p-4 dark:border-stone-800 dark:bg-stone-900"
    >
      <div class="mx-auto max-w-4xl">
        <div class="relative">
          <textarea
            v-model="inputMessage"
            :placeholder="inputPlaceholder"
            :disabled="!props.conversation"
            rows="1"
            class="text-sm text-stone-900 leading-relaxed px-4 py-3 pr-28 border border-stone-300 rounded-xl bg-stone-50 max-h-[180px] min-h-[52px] w-full resize-y transition-colors dark:text-stone-200 focus:outline-none dark:border-stone-700 focus:border-stone-500 dark:bg-stone-900 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed dark:focus:border-stone-500 dark:focus:bg-stone-800 placeholder-stone-400 dark:placeholder-stone-500"
            @keydown="handleKeydown"
          />

          <div class="flex gap-2 items-center bottom-2.5 right-2.5 absolute">
            <button
              v-if="isStreaming"
              class="text-stone-700 border border-stone-300 rounded-lg bg-stone-100 flex h-8 w-8 items-center justify-center dark:text-stone-200 dark:border-stone-700 dark:bg-stone-800"
              @click="cancelCurrentResponse"
            >
              <div class="i-ph-stop-circle text-lg" />
            </button>
            <button
              class="text-white rounded-lg bg-stone-700 flex h-8 w-8 transition-colors items-center justify-center dark:bg-stone-600 hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-stone-500"
              :disabled="isInputDisabled || !inputMessage.trim()"
              @click="handleSend"
            >
              <div class="i-ph-paper-plane-right text-lg" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
