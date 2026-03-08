<script setup lang="ts">
import { RouterLink, useRoute } from "vue-router";
import { useDarkTheme } from "../../composables/dark-theme";

const route = useRoute();
const { animatedToggleTheme } = useDarkTheme();

const navItems = [
  { path: "/", label: "Create", icon: "i-ph-plus-circle" },
  { path: "/projects", label: "Projects", icon: "i-ph-folder" },
  { path: "/settings", label: "Settings", icon: "i-ph-gear" },
];

function isActive(path: string) {
  if (path === "/projects") return route.path === "/projects";
  return route.path === path;
}
</script>

<template>
  <header class="border-b border-stone-200 h-16 dark:border-stone-800">
    <div
      class="mx-auto px-4 flex h-full max-w-7xl items-center justify-between md:px-6"
    >
      <a
        class="text-xl text-stone-900 font-semibold flex gap-3 items-center dark:text-stone-100"
        cursor-pointer
        select-none
        href="https://github.com/liangmiQwQ/WikiGen"
        target="_blank"
      >
        <div class="i-ph-article-ny-times text-3xl" />
        <span>WikiGen</span>
      </a>
      <div class="flex gap-2 items-center">
        <nav class="flex gap-1">
          <RouterLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="text-sm font-medium px-3 py-2 rounded-md flex gap-1.5 items-center md:px-4"
            :class="
              isActive(item.path)
                ? 'bg-stone-200 text-stone-900 dark:bg-stone-800 dark:text-stone-100'
                : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200'
            "
          >
            <div :class="item.icon" class="text-lg" />
            <span class="hidden sm:inline">{{ item.label }}</span>
          </RouterLink>
        </nav>
        <button
          class="text-stone-500 ml-2 p-2 rounded-md dark:text-stone-400 hover:text-stone-900 hover:bg-stone-100 dark:hover:text-stone-200 dark:hover:bg-stone-800"
          @click="animatedToggleTheme"
        >
          <div i-ph-moon-stars-duotone dark:i-ph-sun-dim-duotone text-xl />
        </button>
      </div>
    </div>
  </header>
</template>
