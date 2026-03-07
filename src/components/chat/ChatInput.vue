<script setup lang="ts">
import { computed, ref } from "vue";
import { useSettings } from "../../composables/settings";

const props = defineProps<{
  disabled?: boolean;
}>();

const emit = defineEmits<{
  send: [content: string];
}>();

const { settings } = useSettings();
const isDark = computed(() => settings.value.theme === "dark");

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
  <div
    class="p-3 border-t md:p-4"
    :class="
      isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
    "
  >
    <div class="flex gap-2 max-w-full items-end md:mx-auto md:max-w-3xl">
      <textarea
        v-model="input"
        placeholder="Type your message..."
        :disabled="disabled"
        rows="1"
        class="text-sm leading-relaxed px-3.5 py-2.5 border rounded-lg flex-1 max-h-[120px] min-h-[44px] resize-none md:px-4 md:py-3 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
        :class="
          isDark
            ? 'bg-stone-900 border-stone-700 text-stone-200 placeholder-stone-500 focus:border-stone-500 focus:bg-stone-800'
            : 'bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-500 focus:bg-white'
        "
        @keydown="handleKeydown"
      />
      <button
        class="text-lg text-white rounded-lg flex flex-shrink-0 h-11 w-11 items-center justify-center disabled:opacity-50 md:h-12 md:w-12 disabled:cursor-not-allowed"
        :class="
          isDark
            ? 'bg-stone-600 hover:bg-stone-500'
            : 'bg-stone-700 hover:bg-stone-800'
        "
        :disabled="disabled || !input.trim()"
        @click="handleSend"
      >
        <div class="i-ph-paper-plane-right text-xl" />
      </button>
    </div>
  </div>
</template>
