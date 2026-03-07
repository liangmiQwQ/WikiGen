<script setup lang="ts">
import { computed, ref } from "vue";
import { useProjects } from "../../composables/use-projects";
import type { Project } from "../../types";

const props = defineProps<{
  project: Project;
}>();

const { deleteProject } = useProjects();

const activeTab = ref<"preview" | "code">("preview");
const showDeleteConfirm = ref(false);

const previewUrl = computed(() => {
  const blob = new Blob([props.project.html], { type: "text/html" });
  return URL.createObjectURL(blob);
});

function handleDelete() {
  deleteProject(props.project.id);
  showDeleteConfirm.value = false;
}
</script>

<template>
  <div
    class="border border-gray-200 rounded-lg bg-white flex flex-col h-full overflow-hidden"
  >
    <div
      class="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between"
    >
      <div class="flex flex-col gap-1 min-w-0">
        <span class="text-sm text-gray-900 font-semibold truncate">{{
          project.name
        }}</span>
        <span class="text-xs text-gray-500 truncate">{{
          project.description
        }}</span>
      </div>
      <div class="flex gap-2 items-center">
        <div class="flex gap-1">
          <button
            class="text-base text-gray-500 p-1.5 rounded flex items-center justify-center hover:text-gray-900 hover:bg-gray-100"
            :class="activeTab === 'preview' ? 'bg-white text-blue-600' : ''"
            @click="activeTab = 'preview'"
          >
            <div class="i-ph-eye" />
          </button>
          <button
            class="text-base text-gray-500 p-1.5 rounded flex items-center justify-center hover:text-gray-900 hover:bg-gray-100"
            :class="activeTab === 'code' ? 'bg-white text-blue-600' : ''"
            @click="activeTab = 'code'"
          >
            <div class="i-ph-code" />
          </button>
        </div>
        <button
          class="text-base text-gray-500 p-1.5 rounded flex items-center justify-center hover:text-red-600 hover:bg-red-50"
          @click="showDeleteConfirm = true"
        >
          <div class="i-ph-trash" />
        </button>
      </div>
    </div>
    <div class="flex-1 overflow-hidden">
      <div v-if="activeTab === 'preview'" class="h-full w-full">
        <iframe
          :src="previewUrl"
          sandbox="allow-scripts"
          title="Project Preview"
          class="border-0 h-full w-full"
        />
      </div>
      <div v-else class="bg-gray-800 h-full w-full overflow-auto">
        <pre
          class="text-xs text-gray-200 leading-relaxed font-mono m-0 p-4 whitespace-pre-wrap break-all"
          >{{ project.html }}</pre
        >
      </div>
    </div>

    <div
      v-if="showDeleteConfirm"
      class="p-4 bg-black/50 flex items-center inset-0 justify-center fixed z-50"
      @click="showDeleteConfirm = false"
    >
      <div class="p-5 rounded-lg bg-white max-w-sm w-full" @click.stop>
        <h3 class="text-base text-gray-900 font-semibold mb-3">
          Delete Project
        </h3>
        <p class="text-sm text-gray-500 mb-5">
          Are you sure you want to delete "{{ project.name }}"?
        </p>
        <div class="flex gap-2 justify-end">
          <button
            class="text-sm text-gray-700 font-medium px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
            @click="showDeleteConfirm = false"
          >
            Cancel
          </button>
          <button
            class="text-sm text-white font-medium px-4 py-2 rounded-md bg-red-600 hover:bg-red-700"
            @click="handleDelete"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
