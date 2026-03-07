<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useDarkTheme } from "../../composables/dark-theme";
import { useProjects } from "../../composables/projects";
import type { Conversation } from "../../types";

const props = defineProps<{
  conversation: Conversation | null;
}>();

const { isDark } = useDarkTheme();
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
  <div
    class="flex flex-col h-full"
    :class="isDark ? 'bg-stone-900' : 'bg-white'"
  >
    <!-- Tabs -->
    <div
      class="px-4 py-3 border-b"
      :class="
        isDark
          ? 'border-stone-800 bg-stone-800/50'
          : 'border-stone-200 bg-stone-50'
      "
    >
      <div class="flex items-center justify-between">
        <div class="flex gap-1">
          <button
            class="text-sm font-medium px-3 py-2 rounded-md flex gap-1.5 items-center"
            :class="
              activeTab === 'preview'
                ? isDark
                  ? 'bg-stone-800 text-stone-200 shadow-sm'
                  : 'bg-white text-stone-800 shadow-sm'
                : isDark
                  ? 'text-stone-500 hover:bg-stone-800 hover:text-stone-300'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
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
                ? isDark
                  ? 'bg-stone-800 text-stone-200 shadow-sm'
                  : 'bg-white text-stone-800 shadow-sm'
                : isDark
                  ? 'text-stone-500 hover:bg-stone-800 hover:text-stone-300'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
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
          class="text-sm text-white font-medium px-3 py-2 rounded-md flex gap-1.5 items-center"
          :class="
            isDark
              ? 'bg-stone-600 hover:bg-stone-500'
              : 'bg-stone-700 hover:bg-stone-800'
          "
          @click="showSaveDialog = true"
        >
          <div class="i-ph-floppy-disk text-base" />
          <span>Save Project</span>
        </button>
        <span
          v-else-if="isProjectSaved"
          class="text-sm flex gap-1.5 items-center"
          :class="isDark ? 'text-stone-500' : 'text-stone-400'"
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
          class="p-8 text-center flex flex-col h-full w-full items-center justify-center"
          :class="isDark ? 'text-stone-500' : 'text-stone-400'"
        >
          <div
            class="text-2xl mb-4 rounded-xl flex h-12 w-12 items-center justify-center"
            :class="
              isDark
                ? 'bg-stone-800 text-stone-500'
                : 'bg-stone-100 text-stone-400'
            "
          >
            <div class="i-ph-globe text-xl" />
          </div>
          <p
            class="text-sm font-medium mb-2"
            :class="isDark ? 'text-stone-400' : 'text-stone-500'"
          >
            No website generated yet
          </p>
          <span
            class="text-sm"
            :class="isDark ? 'text-stone-500' : 'text-stone-400'"
          >
            Fill out the form to create your knowledge website
          </span>
        </div>
      </div>

      <!-- Code Tab -->
      <div
        v-else-if="activeTab === 'code'"
        class="h-full w-full overflow-auto"
        :class="isDark ? 'bg-stone-950' : 'bg-stone-900'"
      >
        <pre
          v-if="currentHtml"
          class="text-xs leading-relaxed font-mono m-0 p-4 whitespace-pre-wrap break-all md:text-sm"
          :class="isDark ? 'text-stone-300' : 'text-stone-200'"
          >{{ currentHtml }}</pre
        >
        <div
          v-else
          class="p-8 text-center flex flex-col h-full w-full items-center justify-center"
          :class="isDark ? 'text-stone-500' : 'text-stone-400'"
        >
          <div
            class="text-2xl mb-4 rounded-xl flex h-12 w-12 items-center justify-center"
            :class="
              isDark
                ? 'bg-stone-800 text-stone-500'
                : 'bg-stone-100 text-stone-400'
            "
          >
            <div class="i-ph-file-html text-xl" />
          </div>
          <p
            class="text-sm font-medium"
            :class="isDark ? 'text-stone-400' : 'text-stone-500'"
          >
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
        class="p-5 rounded-lg max-w-sm w-full"
        :class="isDark ? 'bg-stone-900' : 'bg-white'"
        @click.stop
      >
        <h3
          class="text-base font-semibold mb-3"
          :class="isDark ? 'text-stone-100' : 'text-stone-900'"
        >
          Save Project
        </h3>
        <p
          class="text-sm mb-5"
          :class="isDark ? 'text-stone-400' : 'text-stone-500'"
        >
          Save "{{ conversation?.website?.name }}" to your projects?
        </p>
        <div class="flex gap-2 justify-end">
          <button
            class="text-sm font-medium px-4 py-2 rounded-md"
            :class="
              isDark
                ? 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            "
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
