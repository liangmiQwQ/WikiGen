<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

const generationProgress = ref(0);

let progressInterval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  // Simulate progress while generating
  progressInterval = setInterval(() => {
    if (generationProgress.value < 90) {
      generationProgress.value += Math.random() * 15;
      if (generationProgress.value > 90) generationProgress.value = 90;
    }
  }, 500);
});

onUnmounted(() => {
  if (progressInterval) {
    clearInterval(progressInterval);
  }
});
</script>

<template>
  <div class="p-8 flex flex-col h-full items-center justify-center">
    <div class="mx-auto text-center max-w-md w-full">
      <div
        class="text-4xl text-stone-600 mx-auto mb-6 rounded-2xl bg-stone-200 flex h-20 w-20 items-center justify-center animate-pulse dark:text-stone-300 dark:bg-stone-800"
      >
        <div class="i-ph-magic-wand text-3xl" />
      </div>

      <h2 class="text-2xl text-stone-900 font-bold mb-2 dark:text-stone-100">
        Creating...
      </h2>

      <p class="text-sm text-stone-600 mb-8 dark:text-stone-400">
        Our AI is crafting a beautiful knowledge website for you...
      </p>

      <!-- Progress Bar -->
      <div class="mb-4 w-full">
        <div
          class="rounded-full bg-stone-100 h-2 w-full overflow-hidden dark:bg-stone-800"
        >
          <div
            class="rounded-full bg-stone-600 h-full transition-all duration-300 ease-out dark:bg-stone-500"
            :style="{ width: `${Math.min(generationProgress, 100)}%` }"
          />
        </div>
      </div>

      <p class="text-xs text-stone-400 dark:text-stone-500">
        {{ Math.round(Math.min(generationProgress, 100)) }}% complete
      </p>

      <!-- Animated steps -->
      <div class="mt-8 flex gap-2 justify-center">
        <span
          class="rounded-full bg-stone-400 h-2 w-2 animate-bounce dark:bg-stone-600"
          style="animation-delay: 0ms"
        />
        <span
          class="rounded-full bg-stone-400 h-2 w-2 animate-bounce dark:bg-stone-600"
          style="animation-delay: 150ms"
        />
        <span
          class="rounded-full bg-stone-400 h-2 w-2 animate-bounce dark:bg-stone-600"
          style="animation-delay: 300ms"
        />
      </div>
    </div>
  </div>
</template>
