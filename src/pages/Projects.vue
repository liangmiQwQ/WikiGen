<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useChat } from "../composables/chat";
import { useDarkTheme } from "../composables/dark-theme";
import { useProjects } from "../composables/projects";

const { projects, deleteProject } = useProjects();
const { selectConversation, conversations } = useChat();
const { isDark } = useDarkTheme();
const router = useRouter();

const hasProjects = computed(() => projects.value.length > 0);
const activeTab = ref<"grid" | "list">("grid");
const showDeleteConfirm = ref<string | null>(null);

function openProject(projectId: string) {
  const project = projects.value.find((p) => p.id === projectId);
  if (project) {
    // Find and select the conversation
    const conversation = conversations.value.find(
      (c) => c.id === project.conversationId,
    );
    if (conversation) {
      selectConversation(conversation.id);
      router.push("/");
    }
  }
}

function handleDelete(projectId: string) {
  deleteProject(projectId);
  showDeleteConfirm.value = null;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getPreviewUrl(html: string): string {
  const blob = new Blob([html], { type: "text/html" });
  return URL.createObjectURL(blob);
}
</script>

<template>
  <div class="mx-auto p-4 h-full max-w-7xl overflow-y-auto md:p-6">
    <!-- Header -->
    <div class="mb-6 flex items-start justify-between">
      <div>
        <h1
          class="text-xl font-semibold mb-1 md:text-2xl"
          :class="isDark ? 'text-stone-100' : 'text-stone-900'"
        >
          Your Projects
        </h1>
        <p
          class="text-sm"
          :class="isDark ? 'text-stone-400' : 'text-stone-500'"
        >
          View and manage your generated knowledge websites
        </p>
      </div>
      <div class="flex gap-2">
        <button
          class="p-2 rounded-md"
          :class="
            activeTab === 'grid'
              ? isDark
                ? 'bg-stone-800 text-stone-200'
                : 'bg-stone-200 text-stone-800'
              : isDark
                ? 'text-stone-500 hover:bg-stone-800'
                : 'text-stone-500 hover:bg-stone-100'
          "
          @click="activeTab = 'grid'"
        >
          <div class="i ph-squares-four text-lg" />
        </button>
        <button
          class="p-2 rounded-md"
          :class="
            activeTab === 'list'
              ? isDark
                ? 'bg-stone-800 text-stone-200'
                : 'bg-stone-200 text-stone-800'
              : isDark
                ? 'text-stone-500 hover:bg-stone-800'
                : 'text-stone-500 hover:bg-stone-100'
          "
          @click="activeTab = 'list'"
        >
          <div class="i ph-list text-lg" />
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="!hasProjects"
      class="py-12 text-center border rounded-lg md:py-16"
      :class="
        isDark
          ? 'border-stone-800 bg-stone-900'
          : 'border-stone-200 bg-stone-100'
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
        Create your first knowledge website to get started!
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

    <!-- Grid View -->
    <div v-else-if="activeTab === 'grid'" class="gap-4 grid md:grid-cols-2">
      <div
        v-for="project in projects"
        :key="project.id"
        class="group border rounded-lg transition-shadow overflow-hidden hover:shadow-lg"
        :class="
          isDark
            ? 'border-stone-800 bg-stone-900'
            : 'border-stone-200 bg-stone-100'
        "
      >
        <!-- Preview -->
        <div class="bg-stone-100 h-48 w-full relative overflow-hidden">
          <iframe
            :src="getPreviewUrl(project.html)"
            sandbox="allow-scripts"
            title="Project Preview"
            class="border-0 h-full w-full pointer-events-none"
          />
          <div
            class="bg-black/0 opacity-0 flex transition-opacity items-center inset-0 justify-center absolute group-hover:bg-black/50 group-hover:opacity-100"
          >
            <button
              class="text-sm text-white font-medium px-4 py-2 rounded-md"
              :class="isDark ? 'bg-stone-600' : 'bg-stone-700'"
              @click="openProject(project.id)"
            >
              Open Project
            </button>
          </div>
        </div>

        <!-- Info -->
        <div class="p-4">
          <div class="mb-2 flex items-start justify-between">
            <h3
              class="text-base font-semibold truncate"
              :class="isDark ? 'text-stone-200' : 'text-stone-900'"
            >
              {{ project.name }}
            </h3>
            <button
              class="text-stone-400 hover:text-red-500"
              @click="showDeleteConfirm = project.id"
            >
              <div class="i ph-trash text-lg" />
            </button>
          </div>
          <p
            class="text-sm mb-3 line-clamp-2"
            :class="isDark ? 'text-stone-400' : 'text-stone-600'"
          >
            {{ project.description }}
          </p>
          <p
            class="text-xs"
            :class="isDark ? 'text-stone-500' : 'text-stone-400'"
          >
            Created {{ formatDate(project.createdAt) }}
          </p>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-else class="space-y-3">
      <div
        v-for="project in projects"
        :key="project.id"
        class="p-4 border rounded-lg flex gap-4 transition-colors items-center"
        :class="
          isDark
            ? 'border-stone-800 bg-stone-900 hover:bg-stone-800'
            : 'border-stone-200 bg-stone-100 hover:bg-stone-200'
        "
      >
        <!-- Thumbnail -->
        <div
          class="rounded bg-stone-100 flex-shrink-0 h-20 w-32 overflow-hidden"
        >
          <iframe
            :src="getPreviewUrl(project.html)"
            sandbox="allow-scripts"
            title="Project Preview"
            class="border-0 h-full w-full pointer-events-none"
          />
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <h3
            class="text-base font-semibold mb-1 truncate"
            :class="isDark ? 'text-stone-200' : 'text-stone-900'"
          >
            {{ project.name }}
          </h3>
          <p
            class="text-sm mb-1 truncate"
            :class="isDark ? 'text-stone-400' : 'text-stone-600'"
          >
            {{ project.description }}
          </p>
          <p
            class="text-xs"
            :class="isDark ? 'text-stone-500' : 'text-stone-400'"
          >
            {{ formatDate(project.createdAt) }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex flex-shrink-0 gap-2">
          <button
            class="p-2 rounded-md"
            :class="
              isDark
                ? 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                : 'text-stone-500 hover:bg-stone-200 hover:text-stone-800'
            "
            @click="openProject(project.id)"
          >
            <div class="i ph-arrow-right text-lg" />
          </button>
          <button
            class="text-stone-400 p-2 rounded-md hover:text-red-500"
            :class="isDark ? 'hover:bg-red-900/20' : 'hover:bg-red-50'"
            @click="showDeleteConfirm = project.id"
          >
            <div class="i ph-trash text-lg" />
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <div
      v-if="showDeleteConfirm"
      class="bg-black/50 flex items-center inset-0 justify-center fixed z-50"
      @click="showDeleteConfirm = null"
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
          Are you sure you want to delete this project? This action cannot be
          undone.
        </p>
        <div class="flex gap-2 justify-end">
          <button
            class="text-sm font-medium px-4 py-2 rounded-md"
            :class="
              isDark
                ? 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            "
            @click="showDeleteConfirm = null"
          >
            Cancel
          </button>
          <button
            class="text-sm text-white font-medium px-4 py-2 rounded-md bg-red-600 hover:bg-red-700"
            @click="handleDelete(showDeleteConfirm)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
