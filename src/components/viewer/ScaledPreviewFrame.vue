<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    html: string;
    title?: string;
    baseWidth?: number;
    baseHeight?: number;
  }>(),
  {
    title: "Website Preview",
    baseWidth: 1366,
    baseHeight: 768,
  },
);

const previewUrl = ref("");

watch(
  () => props.html,
  (html) => {
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
    if (!html.trim()) {
      previewUrl.value = "";
      return;
    }
    const blob = new Blob([html], { type: "text/html" });
    previewUrl.value = URL.createObjectURL(blob);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
});

const frameStyle = computed(() => {
  const scale = "min(100cqw / var(--base-w), 100cqh / var(--base-h))";
  return {
    "--base-w": `${props.baseWidth}px`,
    "--base-h": `${props.baseHeight}px`,
    width: `calc(var(--base-w) * ${scale})`,
    height: `calc(var(--base-h) * ${scale})`,
  };
});

const iframeStyle = computed(() => {
  const scale = "min(100cqw / var(--base-w), 100cqh / var(--base-h))";
  return {
    width: "var(--base-w)",
    height: "var(--base-h)",
    transform: `scale(${scale})`,
    transformOrigin: "top left",
  };
});
</script>

<template>
  <div class="h-full w-full [container-type:size] relative overflow-hidden">
    <div class="left-0 top-0 absolute" :style="frameStyle">
      <iframe
        v-if="previewUrl"
        :src="previewUrl"
        sandbox="allow-scripts"
        :title="title"
        class="border-0"
        :style="iframeStyle"
      />
    </div>
  </div>
</template>
