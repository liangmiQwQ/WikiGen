<script setup lang="ts">
import { RouterView } from "vue-router";
import AppHeader from "./components/layout/AppHeader.vue";
</script>

<template>
  <div class="bg-stone-50 min-h-screen dark:bg-stone-950">
    <AppHeader />
    <main class="h-[calc(100vh-64px)] overflow-hidden">
      <RouterView />
    </main>
  </div>
</template>
