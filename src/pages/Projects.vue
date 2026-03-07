<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import CodeEditor from "../components/preview/CodeEditor.vue";
import { useDarkTheme } from "../composables/dark-theme";
import { useProjects } from "../composables/projects";

const { projects } = useProjects();
const { isDark } = useDarkTheme();
const router = useRouter();

const hasProjects = computed(() => projects.value.length > 0);
</script>

<template>
  <div class="mx-auto p-4 h-full max-w-7xl overflow-y-auto md:p-6">
    <div class="mb-6">
      <h1
        class="text-xl font-semibold mb-1 md:text-2xl"
        :class="isDark ? 'text-stone-100' : 'text-stone-900'"
      >
        Your Projects
      </h1>
      <p class="text-sm" :class="isDark ? 'text-stone-400' : 'text-stone-500'">
        View and manage your generated websites
      </p>
    </div>

    <div
      v-if="!hasProjects"
      class="py-12 text-center border rounded-lg md:py-16"
      :class="
        isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
      "
    >
      <div
        class="text-3xl mx-auto mb-4 rounded-2xl flex h-16 w-16 items-center justify-center"
        :class="
          isDark ? 'bg-stone-800 text-stone-400' : 'bg-stone-100 text-stone-500'
        "
      >
        <div class="i-ph-folder-open text-2xl" />
      </div>
      <h3
        class="text-base font-semibold mb-2"
        :class="isDark ? 'text-stone-100' : 'text-stone-900'"
      >
        No projects yet
      </h3>
      <p
        class="text-sm mb-6"
        :class="isDark ? 'text-stone-400' : 'text-stone-500'"
      >
        Start a chat and generate your first website!
      </p>
      <button
        class="text-sm text-white font-medium px-5 py-2.5 rounded-md"
        :class="
          isDark
            ? 'bg-stone-600 hover:bg-stone-500'
            : 'bg-stone-700 hover:bg-stone-800'
        "
        @click="router.push('/')"
      >
        Create Website
      </button>
    </div>

    <div v-else class="gap-4 grid md:grid-cols-2">
      <div
        v-for="project in projects"
        :key="project.id"
        class="h-96 lg:h-[600px] md:h-[500px]"
      >
        <CodeEditor :project="project" />
      </div>
    </div>
  </div>
</template>
