<script setup lang="ts">
import { computed } from "vue";
import { useSettings } from "../../composables/settings";
import type { Message } from "../../types";

const props = defineProps<{
  message: Message;
}>();

const { settings } = useSettings();
const isUser = computed(() => props.message.role === "user");
const isDark = computed(() => settings.value.theme === "dark");

function formatMarkdown(content: string): string {
  const codeBg = isDark.value ? "bg-stone-800" : "bg-stone-200";
  const codeText = isDark.value ? "text-stone-300" : "text-stone-800";
  return content
    .replaceAll(
      /```html\n?[\s\S]*?```/g,
      `<div class="${codeBg} ${codeText} px-3 py-2 rounded-md font-mono text-sm my-2">[HTML Code]</div>`,
    )
    .replaceAll(
      /```[\s\S]*?```/g,
      `<div class="${codeBg} ${codeText} px-3 py-2 rounded-md font-mono text-sm my-2">[Code]</div>`,
    )
    .replaceAll(
      /`([^`]+)`/g,
      `<code class="${codeBg} ${codeText} px-1 py-0.5 rounded text-xs font-mono">$1</code>`,
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
      class="text-base rounded-md flex flex-shrink-0 h-7 w-7 items-center justify-center md:h-8 md:w-8"
      :class="
        isUser
          ? isDark
            ? 'bg-stone-600 text-stone-100'
            : 'bg-stone-700 text-white'
          : isDark
            ? 'bg-stone-800 text-stone-400'
            : 'bg-stone-200 text-stone-600'
      "
    >
      <div v-if="isUser" class="i-ph-user" />
      <div v-else class="i-ph-robot" />
    </div>
    <div class="flex flex-col gap-1 max-w-[calc(100%-40px)] md:max-w-[70%]">
      <div
        class="text-sm leading-relaxed px-3.5 py-2.5 rounded-xl break-words md:px-4 md:py-3"
        :class="
          isUser
            ? isDark
              ? 'bg-stone-600 text-stone-100 rounded-tr-sm'
              : 'bg-stone-700 text-white rounded-tr-sm'
            : isDark
              ? 'bg-stone-800 border border-stone-700 text-stone-200 rounded-tl-sm'
              : 'bg-white border border-stone-200 text-stone-900 rounded-tl-sm'
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
          class="text-xs px-2 py-1 rounded flex gap-1 w-fit items-center"
          :class="
            isDark
              ? 'text-stone-400 bg-stone-800'
              : 'text-stone-700 bg-stone-200'
          "
        >
          <div class="i-ph-check-circle" />
          HTML Generated
        </span>
      </div>
    </div>
  </div>
</template>
