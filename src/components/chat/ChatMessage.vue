<script setup lang="ts">
import MarkdownRender from "markstream-vue";
import type { Message } from "../../types";

const props = defineProps<{
  message: Message;
}>();
</script>

<template>
  <div class="flex gap-3 items-start">
    <div class="flex flex-shrink-0 h-6 w-6 items-center justify-center">
      <div
        v-if="props.message.role === 'user'"
        class="i-ph-user text-stone-500"
      />
      <div v-else class="i-ph-robot text-stone-500" />
    </div>
    <div class="flex-1 min-w-0">
      <MarkdownRender :content="props.message.content" />
      <div v-if="props.message.extractedHtml" class="mt-2 flex gap-2">
        <span
          class="text-xs text-stone-500 px-2 py-1 rounded bg-stone-100 flex gap-1 w-fit items-center"
        >
          <div class="i-ph-check-circle" />
          HTML Generated
        </span>
      </div>
    </div>
  </div>
</template>
