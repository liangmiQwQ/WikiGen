<script setup lang="ts">
import { computed } from "vue";
import { RouterView } from "vue-router";
import AppHeader from "./components/layout/AppHeader.vue";
import { useSettings } from "./composables/settings";

const { settings } = useSettings();

const isDark = computed(() => settings.value.theme === "dark");
</script>

<template>
  <div
    class="min-h-screen"
    :class="isDark ? 'dark bg-stone-950' : 'bg-stone-100'"
  >
    <AppHeader />
    <main class="h-[calc(100vh-64px)] overflow-hidden">
      <RouterView />
    </main>
  </div>
</template>
