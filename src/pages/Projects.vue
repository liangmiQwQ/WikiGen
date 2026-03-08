<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import ScaledPreviewFrame from "../components/viewer/ScaledPreviewFrame.vue";
import { useChat } from "../composables/chat";
import { useProjects } from "../composables/projects";

const { projects, deleteProject } = useProjects();
const { selectConversation, conversations } = useChat();
const router = useRouter();

const hasProjects = computed(() => projects.value.length > 0);
const showDeleteConfirm = ref<string | null>(null);
const showActionsMenu = ref<string | null>(null);
const dropdownPosition = ref({ x: 0, y: 0 });

function openProject(projectId: string) {
  const project = projects.value.find((p) => p.id === projectId);
  if (project) {
    // Find and select the conversation
    const conversation = conversations.value.find(
      (c) => c.id === project.conversationId,
    );
    if (conversation) {
      selectConversation(conversation.id);
      const targetRoute = conversation.website?.currentHtml
        ? "ProjectPreview"
        : "ProjectChat";
      router.push({
        name: targetRoute,
        params: { id: conversation.id },
      });
    }
  }
}

function handleDelete(projectId: string) {
  deleteProject(projectId);
  showDeleteConfirm.value = null;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  const suffix = getDaySuffix(day);
  return `${year} ${month} ${day}${suffix}`;
}

function getDaySuffix(day: number): string {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function toggleActionsMenu(projectId: string, event: MouseEvent) {
  if (showActionsMenu.value === projectId) {
    showActionsMenu.value = null;
  } else {
    showActionsMenu.value = projectId;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    dropdownPosition.value = {
      x: rect.left + rect.width / 2,
      y: rect.bottom + window.scrollY,
    };
  }
}

function isGenerating(projectId: string): boolean {
  const project = projects.value.find((p) => p.id === projectId);
  if (!project) return false;
  const conversation = conversations.value.find(
    (c) => c.id === project.conversationId,
  );
  return conversation?.status === "generating";
}

function isDraft(projectId: string): boolean {
  const project = projects.value.find((p) => p.id === projectId);
  if (!project) return false;
  return project.status === "draft";
}
</script>

<template>
  <div
    class="mx-auto p-4 h-full max-w-7xl overflow-y-auto md:p-6"
    @click="showActionsMenu = null"
  >
    <!-- Header -->
    <div class="mb-6 flex items-start justify-between">
      <div>
        <h1
          class="text-xl text-stone-900 font-semibold mb-1 md:text-2xl dark:text-stone-100"
        >
          Your Projects
        </h1>
        <p class="text-sm text-stone-500 dark:text-stone-400">
          View agent runs and open their latest website artifacts
        </p>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="!hasProjects"
      class="py-12 text-center border border-stone-200 rounded-lg bg-stone-100 md:py-16 dark:border-stone-800 dark:bg-stone-900"
    >
      <div
        class="text-3xl text-stone-500 mx-auto mb-2 rounded-2xl bg-stone-100 flex h-16 w-16 items-center justify-center dark:text-stone-400 dark:bg-stone-800"
      >
        <div class="i-ph-folder-open text-4xl" />
      </div>
      <h3
        class="text-base text-stone-900 font-semibold mb-2 dark:text-stone-100"
      >
        No projects yet
      </h3>
      <p class="text-sm text-stone-500 mb-6 dark:text-stone-400">
        Start your first agent run to get started.
      </p>
      <button
        class="text-sm text-white font-medium px-5 py-2.5 rounded-md bg-stone-700 dark:bg-stone-600 hover:bg-stone-800 dark:hover:bg-stone-500"
        @click="router.push('/')"
      >
        Start Agent
      </button>
    </div>

    <!-- Grid View -->
    <div v-else class="gap-4 grid md:grid-cols-2">
      <div
        v-for="project in projects"
        :key="project.id"
        class="group border border-stone-200 rounded-lg transition-shadow overflow-hidden dark:border-stone-800 hover:shadow-lg"
      >
        <!-- Preview -->
        <div class="h-48 w-full relative overflow-hidden">
          <template v-if="project.html">
            <ScaledPreviewFrame
              :html="project.html"
              title="Project Preview"
              class="pointer-events-none"
            />
          </template>
          <template v-else-if="isGenerating(project.id)">
            <div
              class="bg-stone-100 flex flex-col h-full w-full items-center justify-center dark:bg-stone-900"
            >
              <div
                class="i-ph-spinner text-3xl text-stone-400 mb-2 animate-spin"
              />
              <p class="text-sm text-stone-500 dark:text-stone-400">
                Generating...
              </p>
            </div>
          </template>
          <template v-else>
            <div
              class="bg-stone-100 flex flex-col h-full w-full items-center justify-center dark:bg-stone-900"
            >
              <div class="i-ph-file-dashed text-3xl text-stone-400 mb-2" />
              <p class="text-sm text-stone-500 dark:text-stone-400">Draft</p>
            </div>
          </template>
          <div
            class="bg-black/0 opacity-0 flex transition-opacity items-center inset-0 justify-center absolute group-hover:bg-black/50 group-hover:opacity-100"
          >
            <button
              class="text-sm text-white font-medium px-4 py-2 rounded-md bg-stone-700 dark:bg-stone-600"
              :disabled="isGenerating(project.id)"
              :class="{
                'opacity-50 cursor-not-allowed': isGenerating(project.id),
              }"
              @click="openProject(project.id)"
            >
              {{ isGenerating(project.id) ? "Generating..." : "Open Project" }}
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
            <span
              class="text-xs px-2 py-1 border rounded-full"
              :class="
                project.status === 'done'
                  ? 'text-stone-700 border-stone-300 bg-stone-100 dark:text-stone-300 dark:border-stone-700 dark:bg-stone-800'
                  : 'text-stone-600 border-stone-300 bg-stone-50 dark:text-stone-400 dark:border-stone-700 dark:bg-stone-900'
              "
            >
              {{ project.status === "done" ? "Done" : "Draft" }}
            </span>
            <div class="relative" :data-project-id="project.id">
              <button
                class="p-1.5 rounded bg-stone-100 dark:bg-stone-900 hover:bg-stone-200 dark:hover:bg-stone-800"
                @click.stop="toggleActionsMenu(project.id, $event)"
              >
                <div class="i-ph-dots-three-vertical text-lg" />
              </button>
            </div>
          </div>
          <p
            class="text-sm text-stone-600 mb-3 line-clamp-2 dark:text-stone-400"
          >
            {{
              isDraft(project.id)
                ? "Draft project. Open to continue generation."
                : project.description
            }}
          </p>
          <p class="text-xs text-stone-400 dark:text-stone-500">
            Created {{ formatDate(project.createdAt) }}
          </p>
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

    <!-- Teleported Dropdown Menu -->
    <Teleport to="body">
      <div
        v-if="showActionsMenu"
        class="py-1 border border-stone-200 rounded-lg bg-white min-w-[140px] shadow-lg fixed z-[100] dark:border-stone-700 dark:bg-stone-900"
        :style="{
          left: `${dropdownPosition.x}px`,
          top: `${dropdownPosition.y + 8}px`,
          transform: 'translateX(-50%)',
        }"
        @click.stop
      >
        <button
          class="text-sm text-red-600 px-4 py-2 text-left flex gap-2 w-full items-center dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          @click="
            showDeleteConfirm = showActionsMenu;
            showActionsMenu = null;
          "
        >
          <div class="i-ph-trash text-base" />
          Delete
        </button>
      </div>
    </Teleport>
  </div>
</template>
