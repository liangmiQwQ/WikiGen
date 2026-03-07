<script setup lang="ts">
import { RouterLink, useRoute } from "vue-router";

const route = useRoute();

const navItems = [
  { path: "/", label: "Chat", icon: "i-ph-chat-circle-text" },
  { path: "/projects", label: "Projects", icon: "i-ph-folder" },
  { path: "/settings", label: "Settings", icon: "i-ph-gear" },
];
</script>

<template>
  <header class="border-b border-gray-200 bg-white h-16">
    <div
      class="mx-auto px-4 flex h-full max-w-7xl items-center justify-between md:px-6"
    >
      <div class="text-xl text-gray-900 font-semibold flex gap-2 items-center">
        <div
          class="text-lg text-white rounded-lg flex h-8 w-8 items-center justify-center from-blue-600 to-purple-600 bg-gradient-to-br"
        >
          <div class="i-ph-lightning-fill" />
        </div>
        <span>WikiGen</span>
      </div>
      <nav class="flex gap-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="text-sm font-medium px-3 py-2 rounded-md flex gap-1.5 transition-colors items-center md:px-4"
          :class="
            route.path === item.path
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
          "
        >
          <div :class="item.icon" class="text-lg" />
          <span class="hidden sm:inline">{{ item.label }}</span>
        </RouterLink>
      </nav>
    </div>
  </header>
</template>
