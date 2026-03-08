<script setup lang="ts">
import MarkdownRender from "markstream-vue";
import { ref } from "vue";
import type { Message } from "../../types";

const props = defineProps<{
  message: Message;
  isStreaming?: boolean;
  isStreamingThis?: boolean;
  canRegenerate?: boolean;
}>();

const emit = defineEmits<{
  regenerate: [message: Message];
  saveEdit: [message: Message, newContent: string];
}>();

const isEditing = ref(false);
const editingDraft = ref("");

function startEditing() {
  if (props.isStreaming || props.message.role !== "user") return;
  isEditing.value = true;
  editingDraft.value = props.message.content;
}

function cancelEditing() {
  isEditing.value = false;
  editingDraft.value = "";
}

function handleSave() {
  const draft = editingDraft.value.trim();
  if (!draft || props.isStreaming) return;
  emit("saveEdit", props.message, draft);
  isEditing.value = false;
}
</script>

<template>
  <div class="w-full">
    <!-- Tool Run Message -->
    <template v-if="message.kind === 'tool-run' && message.toolRun">
      <div
        class="mx-auto p-3 border border-stone-200 rounded-xl bg-stone-50 max-w-3xl dark:border-stone-700 dark:bg-stone-800"
      >
        <div class="mb-2 flex items-center justify-between">
          <div class="text-sm text-stone-800 font-medium dark:text-stone-100">
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
              <div class="text-stone-700 font-medium dark:text-stone-200">
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

    <!-- Content Message (User or Assistant) -->
    <template v-else>
      <!-- User Message -->
      <div v-if="message.role === 'user'" class="ml-auto w-[50%]">
        <div
          class="text-sm text-stone-900 p-3 rounded-2xl bg-stone-200 dark:text-stone-100 dark:bg-stone-700"
        >
          <template v-if="isEditing">
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
                @click="handleSave"
              >
                Save & Regenerate
              </button>
            </div>
          </template>
          <template v-else>
            <span class="leading-relaxed whitespace-pre-wrap">
              {{ message.content }}
            </span>
          </template>
        </div>
        <div v-if="!isEditing" class="mt-1 flex justify-end">
          <button
            class="text-stone-500 rounded-md flex h-7 w-7 transition-colors items-center justify-center dark:text-stone-400 hover:text-stone-700 hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed dark:hover:text-stone-200 dark:hover:bg-stone-800"
            title="Edit & Regenerate"
            aria-label="Edit and regenerate"
            :disabled="isStreaming"
            @click="startEditing"
          >
            <div class="i-ph-pencil-simple-line text-sm" />
          </button>
        </div>
      </div>

      <!-- Assistant Message -->
      <div v-else class="text-stone-900 mx-auto max-w-3xl dark:text-stone-100">
        <div
          class="max-w-none prose prose-stone prose-sm prose-a:text-stone-700 prose-code:text-stone-200 prose-p:leading-7 prose-headings:font-semibold prose-pre:rounded-xl prose-pre:bg-stone-900 dark:prose-invert dark:prose-a:text-stone-300"
        >
          <MarkdownRender :content="message.content" />
        </div>
        <div class="flex flex-wrap gap-1.5 -ml-2">
          <button
            class="text-stone-500 rounded-md flex h-7 w-7 transition-colors items-center justify-center dark:text-stone-400 hover:text-stone-700 hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed dark:hover:text-stone-200 dark:hover:bg-stone-800"
            title="Regenerate"
            aria-label="Regenerate"
            :disabled="isStreaming || !canRegenerate"
            @click="emit('regenerate', message)"
          >
            <div class="i-ph-arrow-clockwise text-sm" />
          </button>
        </div>
      </div>
    </template>

    <!-- Streaming Dots (if this is the last message and it's assistant) -->
    <div v-if="isStreamingThis" class="mx-auto p-2 max-w-3xl">
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
  </div>
</template>
