<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { useSettings } from "../../composables/settings";

const route = useRoute();
const { settings, updateTheme } = useSettings();

const isDark = computed(() => settings.value.theme === "dark");

function toggleTheme() {
  updateTheme(isDark.value ? "light" : "dark");
}

const navItems = [
  { path: "/", label: "Chat", icon: "i-ph-chat-circle-text" },
  { path: "/projects", label: "Projects", icon: "i-ph-folder" },
  { path: "/settings", label: "Settings", icon: "i-ph-gear" },
];
</script>

<template>
  <header
    class="border-b h-16"
    :class="
      isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
    "
  >
    <div
      class="mx-auto px-4 flex h-full max-w-7xl items-center justify-between md:px-6"
    >
      <div
        class="text-xl font-semibold flex gap-2 items-center"
        :class="isDark ? 'text-stone-100' : 'text-stone-900'"
      >
        <div
          class="text-lg text-white rounded-lg flex h-8 w-8 ring-1 ring-stone-500/50 items-center justify-center from-stone-600 to-stone-800 bg-gradient-to-br"
        >
          <div class="i-ph-article-fill" />
        </div>
        <span>WikiGen</span>
      </div>
      <div class="flex gap-2 items-center">
        <nav class="flex gap-1">
          <RouterLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="text-sm font-medium px-3 py-2 rounded-md flex gap-1.5 items-center md:px-4"
            :class="
              route.path === item.path
                ? isDark
                  ? 'bg-stone-800 text-stone-200'
                  : 'bg-stone-100 text-stone-800'
                : isDark
                  ? 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
            "
          >
            <div :class="item.icon" class="text-lg" />
            <span class="hidden sm:inline">{{ item.label }}</span>
          </RouterLink>
        </nav>
        <button
          class="ml-2 p-2 rounded-md"
          :class="
            isDark
              ? 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'
              : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
          "
          @click="toggleTheme"
        >
          <div i-ph-moon-stars-duotone dark:i-ph-sun-dim-duotone text-xl />
        </button>
      </div>
    </div>
  </header>
</template>
