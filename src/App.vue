<script setup lang="ts">
import { RouterView } from "vue-router";
import AppHeader from "./components/layout/AppHeader.vue";
</script>

<template>
  <div class="bg-gray-100 min-h-screen">
    <AppHeader />
    <main class="h-[calc(100vh-64px)] overflow-hidden">
      <RouterView />
    </main>
  </div>
</template>
