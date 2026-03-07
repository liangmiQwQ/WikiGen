<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  disabled?: boolean;
}>();

const emit = defineEmits<{
  send: [content: string];
}>();

const input = ref("");

function handleSend() {
  const content = input.value.trim();
  if (!content || props.disabled) return;
  emit("send", content);
  input.value = "";
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}
</script>

<template>
  <div class="p-3 border-t border-gray-200 bg-white md:p-4">
    <div class="flex gap-2 max-w-full items-end md:mx-auto md:max-w-3xl">
      <textarea
        v-model="input"
        placeholder="Type your message..."
        :disabled="disabled"
        rows="1"
        class="text-sm leading-relaxed px-3.5 py-2.5 border border-gray-200 rounded-lg bg-gray-50 flex-1 max-h-[120px] min-h-[44px] resize-none md:px-4 md:py-3 focus:outline-none focus:border-blue-600 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
        @keydown="handleKeydown"
      />
      <button
        class="text-lg text-white rounded-lg bg-blue-600 flex flex-shrink-0 h-11 w-11 items-center justify-center hover:bg-blue-700 disabled:opacity-50 md:h-12 md:w-12 disabled:cursor-not-allowed"
        :disabled="disabled || !input.trim()"
        @click="handleSend"
      >
        <div class="i-ph-paper-plane-right text-xl" />
      </button>
    </div>
  </div>
</template>
