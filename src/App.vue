<script setup lang="ts">
import { RouterView } from "vue-router";
import AppHeader from "./components/layout/AppHeader.vue";
import { useDarkTheme } from "./composables/dark-theme";

const { isDark } = useDarkTheme();
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
