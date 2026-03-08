<script setup lang="ts">
import { computed } from "vue";
import { RouterView, useRoute } from "vue-router";
import AppHeader from "./components/layout/AppHeader.vue";

const route = useRoute();
const isProjectRoute = computed(() => route.path.startsWith("/project/"));
</script>

<template>
  <div class="bg-stone-50 min-h-screen dark:bg-stone-950">
    <AppHeader v-if="!isProjectRoute" />
    <main :class="isProjectRoute ? '' : 'h-[calc(100vh-64px)] overflow-hidden'">
      <RouterView />
    </main>
  </div>
</template>
