<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import CodeEditor from "../components/preview/CodeEditor.vue";
import { useProjects } from "../composables/use-projects";

const { projects } = useProjects();
const router = useRouter();

const hasProjects = computed(() => projects.value.length > 0);
</script>

<template>
  <div class="mx-auto p-4 h-full max-w-7xl overflow-y-auto md:p-6">
    <div class="mb-6">
      <h1 class="text-xl text-gray-900 font-semibold mb-1 md:text-2xl">
        Your Projects
      </h1>
      <p class="text-sm text-gray-500">
        View and manage your generated websites
      </p>
    </div>

    <div
      v-if="!hasProjects"
      class="py-12 text-center border border-gray-200 rounded-lg bg-white md:py-16"
    >
      <div
        class="text-3xl text-gray-400 mx-auto mb-4 rounded-2xl bg-gray-100 flex h-16 w-16 items-center justify-center"
      >
        <div class="i-ph-folder-open text-2xl" />
      </div>
      <h3 class="text-base text-gray-900 font-semibold mb-2">
        No projects yet
      </h3>
      <p class="text-sm text-gray-500 mb-6">
        Start a chat and generate your first website!
      </p>
      <button
        class="text-sm text-white font-medium px-5 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700"
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
