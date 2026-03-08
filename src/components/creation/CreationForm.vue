<script setup lang="ts">
import { reactive, ref } from "vue";
import type { WebsiteFormData } from "../../types";

const emit = defineEmits<{
  submit: [data: WebsiteFormData];
}>();

const showAdvanced = ref(false);

const formData = reactive<WebsiteFormData>({
  topic: "",
  targetAudience: "",
  keySections: [],
  stylePreference: "modern",
  additionalRequirements: "",
});

const sectionOptions = [
  { value: "introduction", label: "Introduction/Overview" },
  { value: "concepts", label: "Key Concepts" },
  { value: "examples", label: "Examples & Case Studies" },
  { value: "faq", label: "FAQ Section" },
  { value: "resources", label: "Additional Resources" },
  { value: "glossary", label: "Glossary/Terms" },
];

const styleOptions = [
  { value: "modern", label: "Modern", icon: "i-ph-rocket" },
  { value: "classic", label: "Classic", icon: "i-ph-book-bookmark" },
  { value: "minimal", label: "Minimal", icon: "i-ph-minus-square" },
  { value: "colorful", label: "Colorful", icon: "i-ph-palette" },
] as const;

function toggleSection(section: string) {
  const index = formData.keySections.indexOf(section);
  if (index === -1) {
    formData.keySections.push(section);
  } else {
    formData.keySections.splice(index, 1);
  }
}

function handleSubmit() {
  if (!formData.topic.trim()) return;
  emit("submit", { ...formData });
}
</script>

<template>
  <div class="p-4 md:(p-6 h-full)" flex="~ items-center justify-center">
    <div class="mx-auto max-w-2xl">
      <div class="mb-8 text-center">
        <div
          border
          border-stone-400
          dark:border-stone-600
          class="text-3xl text-stone-600 mx-auto mb-4 rounded-2xl flex h-16 w-16 items-center justify-center dark:text-stone-300"
        >
          <div class="i-ph-book-open-text text-2xl" />
        </div>
        <h1
          class="text-2xl text-stone-900 font-bold mb-2 md:text-3xl dark:text-stone-100"
        >
          Start An Agent Run
        </h1>
        <p class="text-base text-stone-600 dark:text-stone-400">
          Define the goal, then let the agent plan, generate, and iterate.
          Website output is produced as one artifact in the run.
        </p>
      </div>

      <form
        class="text-stone-800 space-y-6 dark:text-stone-200"
        @submit.prevent="handleSubmit"
      >
        <!-- Topic -->
        <div class="space-y-2">
          <label class="text-sm font-medium flex gap-2 items-center">
            <div class="i-ph-text-t text-lg" />
            Artifact Topic
          </label>
          <input
            v-model="formData.topic"
            type="text"
            placeholder="e.g., Quantum Physics Basics, History of Renaissance Art..."
            class="text-sm text-stone-900 px-4 py-3 border border-stone-300 rounded-lg bg-white w-full transition-colors dark:text-stone-100 focus:outline-none dark:border-stone-600 focus:border-stone-500 dark:bg-stone-800/50 dark:focus:border-stone-400 placeholder-stone-400 dark:placeholder-stone-500"
            required
          />
        </div>

        <!-- Style Preference -->
        <div class="space-y-3">
          <label class="text-sm font-medium flex gap-2 items-center">
            <div class="i-ph-paint-brush text-lg" />
            Visual Style
          </label>
          <div class="gap-3 grid grid-cols-2 md:grid-cols-4">
            <button
              v-for="style in styleOptions"
              :key="style.value"
              type="button"
              class="p-4 border rounded-lg flex flex-col gap-2 transition-all items-center"
              :class="
                formData.stylePreference === style.value
                  ? 'border-stone-600 bg-stone-100 text-stone-900 dark:border-stone-500 dark:bg-stone-900 dark:text-stone-100'
                  : 'border-stone-300 text-stone-600 hover:border-stone-400 hover:text-stone-800 dark:border-stone-600 dark:text-stone-400 dark:hover:border-stone-500 dark:hover:text-stone-300'
              "
              @click="formData.stylePreference = style.value"
            >
              <div :class="[style.icon, 'text-2xl']" />
              <span class="text-sm font-medium">{{ style.label }}</span>
            </button>
          </div>
        </div>

        <!-- Additional Requirements -->
        <div class="space-y-2">
          <label class="text-sm font-medium flex gap-2 items-center">
            <div class="i-ph-notebook text-lg" />
            Additional Requirements
          </label>
          <textarea
            v-model="formData.additionalRequirements"
            rows="3"
            placeholder="Any specific features, content requirements, or design preferences..."
            class="text-sm text-stone-900 px-4 py-3 border border-stone-300 rounded-lg bg-white w-full resize-none transition-colors dark:text-stone-100 focus:outline-none dark:border-stone-600 focus:border-stone-500 dark:bg-stone-800/50 dark:focus:border-stone-400 placeholder-stone-400 dark:placeholder-stone-500"
          />
        </div>

        <!-- Advanced Options -->
        <div class="space-y-4">
          <button
            type="button"
            class="text-sm text-stone-600 flex gap-2 w-full transition-colors items-center dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-300"
            @click="showAdvanced = !showAdvanced"
          >
            <div
              :class="showAdvanced ? 'i-ph-caret-down' : 'i-ph-caret-right'"
              class="text-lg"
            />
            Advanced Options
          </button>

          <div v-show="showAdvanced" class="space-y-6">
            <!-- Target Audience -->
            <div class="space-y-2">
              <label class="text-sm font-medium flex gap-2 items-center">
                <div class="i-ph-users text-lg" />
                Target Audience
              </label>
              <input
                v-model="formData.targetAudience"
                type="text"
                placeholder="e.g., High school students, professionals, general public..."
                class="text-sm text-stone-900 px-4 py-3 border border-stone-300 rounded-lg bg-white w-full transition-colors dark:text-stone-100 focus:outline-none dark:border-stone-600 focus:border-stone-500 dark:bg-stone-800/50 dark:focus:border-stone-400 placeholder-stone-400 dark:placeholder-stone-500"
              />
            </div>

            <!-- Key Sections -->
            <div class="space-y-3">
              <label class="text-sm font-medium flex gap-2 items-center">
                <div class="i-ph-list-checks text-lg" />
                Key Sections to Include
              </label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="section in sectionOptions"
                  :key="section.value"
                  type="button"
                  class="text-sm px-4 py-2 border rounded-full transition-all"
                  :class="
                    formData.keySections.includes(section.value)
                      ? 'border-stone-600 bg-stone-300 text-stone-900 dark:border-stone-500 dark:bg-stone-600 dark:text-stone-100'
                      : 'border-stone-300 text-stone-600 hover:border-stone-400 hover:text-stone-800 dark:border-stone-600 dark:text-stone-400 dark:hover:border-stone-500 dark:hover:text-stone-300'
                  "
                  @click="toggleSection(section.value)"
                >
                  {{ section.label }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="text-sm text-stone-800 font-medium py-3 border border-stone-500 rounded-lg bg-stone-50 flex gap-2 w-full transition-all items-center justify-center dark:text-stone-200 dark:border-stone-400 dark:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!formData.topic.trim()"
        >
          <div class="i-ph-magic-wand text-lg" />
          Start Agent
        </button>
      </form>
    </div>
  </div>
</template>
