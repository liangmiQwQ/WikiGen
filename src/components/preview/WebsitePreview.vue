<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useDarkTheme } from "../../composables/dark-theme";
import type { Message } from "../../types";

const props = defineProps<{
  messages: Message[];
}>();

const { isDark } = useDarkTheme();
const activeTab = ref<"preview" | "code">("preview");

const latestHtml = computed(() => {
  for (let i = props.messages.length - 1; i >= 0; i--) {
    const message = props.messages[i];
    if (message.role === "assistant" && message.extractedHtml) {
      return message.extractedHtml;
    }
  }
  return null;
});

const previewUrl = computed(() => {
  if (!latestHtml.value) return "";
  const blob = new Blob([latestHtml.value], { type: "text/html" });
  return URL.createObjectURL(blob);
});

let lastUrl: string | null = null;
watch(previewUrl, (newUrl, oldUrl) => {
  if (oldUrl && oldUrl !== lastUrl) {
    URL.revokeObjectURL(oldUrl);
  }
  lastUrl = newUrl;
});
</script>

<template>
  <div
    class="flex flex-col h-full"
    :class="isDark ? 'bg-stone-900' : 'bg-white'"
  >
    <div
      class="px-4 py-3 border-b"
      :class="
        isDark
          ? 'border-stone-800 bg-stone-800/50'
          : 'border-stone-200 bg-stone-50'
      "
    >
      <div class="flex gap-1">
        <button
          class="text-sm font-medium px-3 py-2 rounded-md flex gap-1.5 items-center"
          :class="
            activeTab === 'preview'
              ? isDark
                ? 'bg-stone-800 text-stone-200 shadow-sm'
                : 'bg-white text-stone-800 shadow-sm'
              : isDark
                ? 'text-stone-500 hover:bg-stone-800 hover:text-stone-300'
                : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
          "
          @click="activeTab = 'preview'"
        >
          <div class="i-ph-eye text-base" />
          <span>Preview</span>
        </button>
        <button
          class="text-sm font-medium px-3 py-2 rounded-md flex gap-1.5 items-center"
          :class="
            activeTab === 'code'
              ? isDark
                ? 'bg-stone-800 text-stone-200 shadow-sm'
                : 'bg-white text-stone-800 shadow-sm'
              : isDark
                ? 'text-stone-500 hover:bg-stone-800 hover:text-stone-300'
                : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
          "
          @click="activeTab = 'code'"
        >
          <div class="i-ph-code text-base" />
          <span>Code</span>
        </button>
      </div>
    </div>
    <div class="flex-1 relative overflow-hidden">
      <div v-if="activeTab === 'preview'" class="h-full w-full">
        <iframe
          v-if="latestHtml"
          :src="previewUrl"
          sandbox="allow-scripts"
          title="Website Preview"
          class="border-0 h-full w-full"
        />
        <div
          v-else
          class="p-8 text-center flex flex-col h-full w-full items-center justify-center"
          :class="isDark ? 'text-stone-500' : 'text-stone-400'"
        >
          <div
            class="text-2xl mb-4 rounded-xl flex h-12 w-12 items-center justify-center"
            :class="
              isDark
                ? 'bg-stone-800 text-stone-500'
                : 'bg-stone-100 text-stone-400'
            "
          >
            <div class="i-ph-globe text-xl" />
          </div>
          <p
            class="text-sm font-medium mb-2"
            :class="isDark ? 'text-stone-400' : 'text-stone-500'"
          >
            No website generated yet
          </p>
          <span
            class="text-sm"
            :class="isDark ? 'text-stone-500' : 'text-stone-400'"
          >
            Ask the AI to create a website for you
          </span>
        </div>
      </div>
      <div
        v-else
        class="h-full w-full overflow-auto"
        :class="isDark ? 'bg-stone-950' : 'bg-stone-900'"
      >
        <pre
          v-if="latestHtml"
          class="text-xs leading-relaxed font-mono m-0 p-4 whitespace-pre-wrap break-all md:text-sm"
          :class="isDark ? 'text-stone-300' : 'text-stone-200'"
          >{{ latestHtml }}</pre
        >
        <div
          v-else
          class="p-8 text-center flex flex-col h-full w-full items-center justify-center"
          :class="isDark ? 'text-stone-500' : 'text-stone-400'"
        >
          <div
            class="text-2xl mb-4 rounded-xl flex h-12 w-12 items-center justify-center"
            :class="
              isDark
                ? 'bg-stone-800 text-stone-500'
                : 'bg-stone-100 text-stone-400'
            "
          >
            <div class="i-ph-file-html text-xl" />
          </div>
          <p
            class="text-sm font-medium"
            :class="isDark ? 'text-stone-400' : 'text-stone-500'"
          >
            No code available
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
