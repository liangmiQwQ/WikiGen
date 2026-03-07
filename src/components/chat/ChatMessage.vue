<script setup lang="ts">
import { computed } from "vue";
import type { Message } from "../../types";

const props = defineProps<{
  message: Message;
}>();

const isUser = computed(() => props.message.role === "user");

function formatMarkdown(content: string): string {
  return content
    .replaceAll(
      /```html\n?[\s\S]*?```/g,
      '<div class="bg-gray-800 text-gray-200 px-3 py-2 rounded-md font-mono text-sm my-2">[HTML Code]</div>',
    )
    .replaceAll(
      /```[\s\S]*?```/g,
      '<div class="bg-gray-800 text-gray-200 px-3 py-2 rounded-md font-mono text-sm my-2">[Code]</div>',
    )
    .replaceAll(
      /`([^`]+)`/g,
      '<code class="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono">$1</code>',
    )
    .replaceAll(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replaceAll(/\*([^*]+)\*/g, '<em class="italic">$1</em>')
    .replaceAll("\n", "<br>");
}
</script>

<template>
  <div
    class="flex gap-2 items-start md:gap-3"
    :class="{ 'flex-row-reverse': isUser }"
  >
    <div
      class="text-base text-gray-500 rounded-md bg-gray-100 flex flex-shrink-0 h-7 w-7 items-center justify-center md:h-8 md:w-8"
      :class="{ 'bg-blue-600 text-white': isUser }"
    >
      <div v-if="isUser" class="i-ph-user" />
      <div v-else class="i-ph-robot" />
    </div>
    <div class="flex flex-col gap-1 max-w-[calc(100%-40px)] md:max-w-[70%]">
      <div
        class="text-sm leading-relaxed px-3.5 py-2.5 rounded-xl break-words md:px-4 md:py-3"
        :class="
          isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm'
        "
      >
        <pre
          v-if="isUser"
          class="font-inherit m-0 whitespace-pre-wrap break-words"
          >{{ message.content }}</pre
        >
        <div v-else v-html="formatMarkdown(message.content)" />
      </div>
      <div v-if="message.extractedHtml" class="flex gap-2">
        <span
          class="text-xs text-green-700 px-2 py-1 rounded bg-green-100 flex gap-1 w-fit items-center"
        >
          <div class="i-ph-check-circle" />
          HTML Generated
        </span>
      </div>
    </div>
  </div>
</template>
