<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useChat } from "../composables/chat";
import { useProjects } from "../composables/projects";

const { projects, deleteProject } = useProjects();
const { selectConversation, conversations } = useChat();
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
          class="text-xl text-stone-900 font-semibold mb-1 md:text-2xl dark:text-stone-100"
        >
          Your Projects
        </h1>
        <p class="text-sm text-stone-500 dark:text-stone-400">
          View and manage your generated knowledge websites
        </p>
      </div>
      <div class="flex gap-2">
        <button
          class="p-2 rounded-md"
          :class="
            activeTab === 'grid'
              ? 'bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-200'
              : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'
          "
          @click="activeTab = 'grid'"
        >
          <div class="i-ph-squares-four text-lg" />
        </button>
        <button
          class="p-2 rounded-md"
          :class="
            activeTab === 'list'
              ? 'bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-200'
              : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'
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
      class="py-12 text-center border border-stone-200 rounded-lg bg-stone-100 md:py-16 dark:border-stone-800 dark:bg-stone-900"
    >
      <div
        class="text-3xl text-stone-500 mx-auto mb-4 rounded-2xl bg-stone-100 flex h-16 w-16 items-center justify-center dark:text-stone-400 dark:bg-stone-800"
      >
        <div class="i-ph-folder-open text-2xl" />
      </div>
      <h3
        class="text-base text-stone-900 font-semibold mb-2 dark:text-stone-100"
      >
        No projects yet
      </h3>
      <p class="text-sm text-stone-500 mb-6 dark:text-stone-400">
        Create your first knowledge website to get started!
      </p>
      <button
        class="text-sm text-white font-medium px-5 py-2.5 rounded-md bg-stone-700 dark:bg-stone-600 hover:bg-stone-800 dark:hover:bg-stone-500"
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
        class="group border border-stone-200 rounded-lg bg-stone-100 transition-shadow overflow-hidden dark:border-stone-800 dark:bg-stone-900 hover:shadow-lg"
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
              class="text-sm text-white font-medium px-4 py-2 rounded-md bg-stone-700 dark:bg-stone-600"
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
              class="text-base text-stone-900 font-semibold truncate dark:text-stone-200"
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
            class="text-sm text-stone-600 mb-3 line-clamp-2 dark:text-stone-400"
          >
            {{ project.description }}
          </p>
          <p class="text-xs text-stone-400 dark:text-stone-500">
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
        class="p-4 border border-stone-200 rounded-lg bg-stone-100 flex gap-4 transition-colors items-center dark:border-stone-800 dark:bg-stone-900 hover:bg-stone-200 dark:hover:bg-stone-800"
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
            class="text-base text-stone-900 font-semibold mb-1 truncate dark:text-stone-200"
          >
            {{ project.name }}
          </h3>
          <p class="text-sm text-stone-600 mb-1 truncate dark:text-stone-400">
            {{ project.description }}
          </p>
          <p class="text-xs text-stone-400 dark:text-stone-500">
            {{ formatDate(project.createdAt) }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex flex-shrink-0 gap-2">
          <button
            class="text-stone-500 p-2 rounded-md dark:text-stone-400 hover:text-stone-800 hover:bg-stone-200 dark:hover:text-stone-200 dark:hover:bg-stone-800"
            @click="openProject(project.id)"
          >
            <div class="i ph-arrow-right text-lg" />
          </button>
          <button
            class="text-stone-400 p-2 rounded-md hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
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
        class="p-5 rounded-lg bg-white max-w-sm w-full dark:bg-stone-900"
        @click.stop
      >
        <h3
          class="text-base text-stone-900 font-semibold mb-3 dark:text-stone-100"
        >
          Delete Project
        </h3>
        <p class="text-sm text-stone-500 mb-5 dark:text-stone-400">
          Are you sure you want to delete this project? This action cannot be
          undone.
        </p>
        <div class="flex gap-2 justify-end">
          <button
            class="text-sm text-stone-700 font-medium px-4 py-2 rounded-md bg-stone-100 dark:text-stone-300 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700"
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
