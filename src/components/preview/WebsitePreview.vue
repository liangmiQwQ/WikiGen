<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Message } from "../../types";

const props = defineProps<{
  messages: Message[];
}>();

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
  <div class="bg-white flex flex-col h-full">
    <div class="px-4 py-3 border-b border-gray-200 bg-gray-50">
      <div class="flex gap-1">
        <button
          class="text-sm font-medium px-3 py-2 rounded-md flex gap-1.5 items-center"
          :class="
            activeTab === 'preview'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
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
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
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
          class="text-gray-400 p-8 text-center flex flex-col h-full w-full items-center justify-center"
        >
          <div
            class="text-2xl text-gray-400 mb-4 rounded-xl bg-gray-100 flex h-12 w-12 items-center justify-center"
          >
            <div class="i-ph-globe text-xl" />
          </div>
          <p class="text-sm text-gray-500 font-medium mb-2">
            No website generated yet
          </p>
          <span class="text-sm">Ask the AI to create a website for you</span>
        </div>
      </div>
      <div v-else class="bg-gray-900 h-full w-full overflow-auto">
        <pre
          v-if="latestHtml"
          class="text-xs text-gray-200 leading-relaxed font-mono m-0 p-4 whitespace-pre-wrap break-all md:text-sm"
          >{{ latestHtml }}</pre
        >
        <div
          v-else
          class="text-gray-400 p-8 text-center flex flex-col h-full w-full items-center justify-center"
        >
          <div
            class="text-2xl text-gray-400 mb-4 rounded-xl bg-gray-100 flex h-12 w-12 items-center justify-center"
          >
            <div class="i-ph-file-html text-xl" />
          </div>
          <p class="text-sm text-gray-500 font-medium">No code available</p>
        </div>
      </div>
    </div>
  </div>
</template>
