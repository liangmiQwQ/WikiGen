<script setup lang="ts">
defineProps<{
  modelValue: string;
  placeholder?: string;
  disabled?: boolean;
  isStreaming?: boolean;
  isInputDisabled?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  send: [];
  cancel: [];
}>();

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    emit("send");
  }
}
</script>

<template>
  <div
    class="p-3 border-t border-stone-200/50 bg-stone-100/80 bottom-0 left-0 right-0 fixed z-30 backdrop-blur-md md:p-4 dark:border-stone-800/50 dark:bg-stone-900/80"
  >
    <div class="mx-auto max-w-3xl w-full">
      <div
        class="group border border-stone-200 rounded-xl bg-white flex flex-col min-h-[80px] shadow-lg transition-all relative dark:border-stone-700 dark:bg-stone-800 focus-within:ring-2 focus-within:ring-stone-200 dark:focus-within:ring-stone-700"
      >
        <textarea
          :value="modelValue"
          :placeholder="placeholder"
          :disabled="disabled"
          class="text-sm text-stone-900 leading-relaxed px-3 py-2 bg-transparent flex-1 w-full resize-none dark:text-stone-200 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed placeholder-stone-400 dark:placeholder-stone-500"
          @input="
            emit(
              'update:modelValue',
              ($event.target as HTMLTextAreaElement).value,
            )
          "
          @keydown="handleKeydown"
        />

        <div class="p-2 flex gap-1.5 items-center justify-end">
          <button
            v-if="isStreaming"
            class="text-sm text-red-600 font-medium px-2.5 rounded-lg flex gap-1.5 h-8 transition-colors items-center justify-center dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            @click="emit('cancel')"
          >
            <div class="i-ph-stop-circle text-lg" />
            <span>Stop</span>
          </button>
          <button
            class="text-sm text-stone-600 font-medium px-2.5 rounded-lg flex gap-1.5 h-8 transition-colors items-center justify-center dark:text-stone-300 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-stone-700"
            :disabled="isInputDisabled || !modelValue.trim()"
            @click="emit('send')"
          >
            <span>Send</span>
            <div class="i-ph-paper-plane-right text-lg" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
