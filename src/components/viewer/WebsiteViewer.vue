<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useProjects } from "../../composables/projects";
import type { Conversation } from "../../types";

const props = defineProps<{
  conversation: Conversation | null;
}>();

const { createProject, getProjectByConversationId } = useProjects();

const activeTab = ref<"preview" | "code">("preview");
const showSaveDialog = ref(false);

const hasWebsite = computed(() => !!props.conversation?.website);

const currentHtml = computed(() => {
  return props.conversation?.website?.currentHtml || "";
});

const previewUrl = computed(() => {
  if (!currentHtml.value) return "";
  const blob = new Blob([currentHtml.value], { type: "text/html" });
  return URL.createObjectURL(blob);
});

let lastUrl: string | null = null;
watch(previewUrl, (newUrl, oldUrl) => {
  if (oldUrl && oldUrl !== lastUrl) {
    URL.revokeObjectURL(oldUrl);
  }
  lastUrl = newUrl;
});

const isProjectSaved = computed(() => {
  if (!props.conversation?.id) return false;
  return !!getProjectByConversationId(props.conversation.id);
});

function handleSave() {
  if (!props.conversation?.website || !showSaveDialog.value) return;

  const { website } = props.conversation;
  createProject(
    website.name,
    website.description,
    website.currentHtml,
    props.conversation.id,
  );
  showSaveDialog.value = false;
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Tabs -->
    <div
      class="px-4 py-3 border-b border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-800/50"
    >
      <div class="flex items-center justify-between">
        <div class="flex gap-1">
          <button
            class="text-sm font-medium px-3 py-2 rounded-md flex gap-1.5 items-center"
            :class="
              activeTab === 'preview'
                ? 'bg-white text-stone-800 shadow-sm dark:bg-stone-800 dark:text-stone-200'
                : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-stone-300'
            "
            @click="activeTab = 'preview'"
          >
            <div class="i-ph-eye text-base" />
            <span>Preview</span>
          </button>
          <button
            class="text-sm font-medium px-3 py-2 rounded-md flex gap-1.5 items-center"
            :class="
              activeTab === 'code'
                ? 'bg-white text-stone-800 shadow-sm dark:bg-stone-800 dark:text-stone-200'
                : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-stone-300'
            "
            @click="activeTab = 'code'"
          >
            <div class="i-ph-code text-base" />
            <span>Code</span>
          </button>
        </div>

        <!-- Save Button -->
        <button
          v-if="hasWebsite && !isProjectSaved"
          class="text-sm text-white font-medium px-3 py-2 rounded-md bg-stone-700 flex gap-1.5 items-center dark:bg-stone-600 hover:bg-stone-800 dark:hover:bg-stone-500"
          @click="showSaveDialog = true"
        >
          <div class="i-ph-floppy-disk text-base" />
          <span>Save Project</span>
        </button>
        <span
          v-else-if="isProjectSaved"
          class="text-sm text-stone-400 flex gap-1.5 items-center dark:text-stone-500"
        >
          <div class="i-ph-check-circle text-base" />
          Saved
        </span>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 relative overflow-hidden">
      <!-- Preview Tab -->
      <div v-if="activeTab === 'preview'" class="h-full w-full">
        <iframe
          v-if="currentHtml"
          :src="previewUrl"
          sandbox="allow-scripts"
          title="Website Preview"
          class="border-0 h-full w-full"
        />
        <div
          v-else
          class="text-stone-400 p-8 text-center flex flex-col h-full w-full items-center justify-center dark:text-stone-500"
        >
          <div
            class="text-2xl text-stone-400 mb-4 rounded-xl bg-stone-100 flex h-12 w-12 items-center justify-center dark:text-stone-500 dark:bg-stone-800"
          >
            <div class="i-ph-globe text-xl" />
          </div>
          <p
            class="text-sm text-stone-500 font-medium mb-2 dark:text-stone-400"
          >
            No website generated yet
          </p>
          <span class="text-sm text-stone-400 dark:text-stone-500">
            Fill out the form to create your knowledge website
          </span>
        </div>
      </div>

      <!-- Code Tab -->
      <div
        v-else-if="activeTab === 'code'"
        class="bg-stone-900 h-full w-full overflow-auto dark:bg-stone-950"
      >
        <pre
          v-if="currentHtml"
          class="text-xs text-stone-200 leading-relaxed font-mono m-0 p-4 whitespace-pre-wrap break-all md:text-sm dark:text-stone-300"
          >{{ currentHtml }}</pre
        >
        <div
          v-else
          class="text-stone-400 p-8 text-center flex flex-col h-full w-full items-center justify-center dark:text-stone-500"
        >
          <div
            class="text-2xl text-stone-400 mb-4 rounded-xl bg-stone-100 flex h-12 w-12 items-center justify-center dark:text-stone-500 dark:bg-stone-800"
          >
            <div class="i-ph-file-html text-xl" />
          </div>
          <p class="text-sm text-stone-500 font-medium dark:text-stone-400">
            No code available
          </p>
        </div>
      </div>
    </div>

    <!-- Save Dialog -->
    <div
      v-if="showSaveDialog"
      class="bg-black/50 flex items-center inset-0 justify-center fixed z-50"
      @click="showSaveDialog = false"
    >
      <div
        class="p-5 rounded-lg bg-white max-w-sm w-full dark:bg-stone-900"
        @click.stop
      >
        <h3
          class="text-base text-stone-900 font-semibold mb-3 dark:text-stone-100"
        >
          Save Project
        </h3>
        <p class="text-sm text-stone-500 mb-5 dark:text-stone-400">
          Save "{{ conversation?.website?.name }}" to your projects?
        </p>
        <div class="flex gap-2 justify-end">
          <button
            class="text-sm text-stone-700 font-medium px-4 py-2 rounded-md bg-stone-100 dark:text-stone-300 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700"
            @click="showSaveDialog = false"
          >
            Cancel
          </button>
          <button
            class="text-sm text-white font-medium px-4 py-2 rounded-md bg-stone-600 hover:bg-stone-700"
            @click="handleSave"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
