<script setup lang="ts">
import { ref } from "vue";
import { useDarkTheme } from "../../composables/dark-theme";
import { useProjects } from "../../composables/projects";
import type { Project } from "../../types";

const props = defineProps<{
  project: Project;
}>();

const { deleteProject } = useProjects();
const { isDark } = useDarkTheme();

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
    class="border rounded-lg flex flex-col h-full overflow-hidden"
    :class="
      isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
    "
  >
    <div
      class="px-4 py-3 border-b flex items-center justify-between"
      :class="
        isDark
          ? 'border-stone-800 bg-stone-800/50'
          : 'border-stone-200 bg-stone-50'
      "
    >
      <div class="flex flex-col gap-1 min-w-0">
        <span
          class="text-sm font-semibold truncate"
          :class="isDark ? 'text-stone-200' : 'text-stone-900'"
          >{{ project.name }}</span
        >
        <span
          class="text-xs truncate"
          :class="isDark ? 'text-stone-500' : 'text-stone-500'"
          >{{ project.description }}</span
        >
      </div>
      <div class="flex gap-2 items-center">
        <div class="flex gap-1">
          <button
            class="text-base p-1.5 rounded flex items-center justify-center"
            :class="
              activeTab === 'preview'
                ? isDark
                  ? 'bg-stone-800 text-stone-200'
                  : 'bg-white text-stone-800 shadow-sm'
                : isDark
                  ? 'text-stone-500 hover:text-stone-300 hover:bg-stone-800'
                  : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
            "
            @click="activeTab = 'preview'"
          >
            <div class="i-ph-eye" />
          </button>
          <button
            class="text-base p-1.5 rounded flex items-center justify-center"
            :class="
              activeTab === 'code'
                ? isDark
                  ? 'bg-stone-800 text-stone-200'
                  : 'bg-white text-stone-800 shadow-sm'
                : isDark
                  ? 'text-stone-500 hover:text-stone-300 hover:bg-stone-800'
                  : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
            "
            @click="activeTab = 'code'"
          >
            <div class="i-ph-code" />
          </button>
        </div>
        <button
          class="text-base p-1.5 rounded flex items-center justify-center"
          :class="
            isDark
              ? 'text-stone-500 hover:text-red-400 hover:bg-red-900/20'
              : 'text-stone-500 hover:text-red-600 hover:bg-red-50'
          "
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
      <div v-else class="h-full w-full overflow-auto">
        <pre
          class="text-xs leading-relaxed font-mono m-0 p-4 whitespace-pre-wrap break-all"
          :class="
            isDark
              ? 'bg-stone-950 text-stone-300'
              : 'bg-stone-900 text-stone-200'
          "
          >{{ project.html }}</pre
        >
      </div>
    </div>

    <div
      v-if="showDeleteConfirm"
      class="p-4 bg-black/50 flex items-center inset-0 justify-center fixed z-50"
      @click="showDeleteConfirm = false"
    >
      <div
        class="p-5 rounded-lg max-w-sm w-full"
        :class="isDark ? 'bg-stone-900' : 'bg-white'"
        @click.stop
      >
        <h3
          class="text-base font-semibold mb-3"
          :class="isDark ? 'text-stone-100' : 'text-stone-900'"
        >
          Delete Project
        </h3>
        <p
          class="text-sm mb-5"
          :class="isDark ? 'text-stone-400' : 'text-stone-500'"
        >
          Are you sure you want to delete "{{ project.name }}"?
        </p>
        <div class="flex gap-2 justify-end">
          <button
            class="text-sm font-medium px-4 py-2 rounded-md"
            :class="
              isDark
                ? 'text-stone-300 bg-stone-800 hover:bg-stone-700'
                : 'text-stone-700 bg-stone-100 hover:bg-stone-200'
            "
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
