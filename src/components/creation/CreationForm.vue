<script setup lang="ts">
import { reactive } from "vue";
import { useDarkTheme } from "../../composables/dark-theme";
import type { WebsiteFormData } from "../../types";

const { isDark } = useDarkTheme();

const emit = defineEmits<{
  submit: [data: WebsiteFormData];
}>();

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
  { value: "minimal", label: "Minimal", icon: "i-ph-minus" },
  { value: "colorful", label: "Colorful", icon: "i ph-palette" },
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
  <div class="p-4 h-full overflow-y-auto md:p-6">
    <div class="mx-auto max-w-2xl">
      <div class="mb-8 text-center">
        <div
          class="text-3xl mx-auto mb-4 rounded-2xl flex h-16 w-16 items-center justify-center"
          :class="
            isDark
              ? 'bg-stone-800 text-stone-300'
              : 'bg-stone-200 text-stone-600'
          "
        >
          <div class="i-ph-book-open-text text-2xl" />
        </div>
        <h1
          class="text-2xl font-bold mb-2 md:text-3xl"
          :class="isDark ? 'text-stone-100' : 'text-stone-900'"
        >
          Create Knowledge Website
        </h1>
        <p
          class="text-base"
          :class="isDark ? 'text-stone-400' : 'text-stone-600'"
        >
          Fill in the details below and let AI generate a beautiful knowledge
          website for you
        </p>
      </div>

      <form
        class="space-y-6"
        :class="isDark ? 'text-stone-200' : 'text-stone-800'"
        @submit.prevent="handleSubmit"
      >
        <!-- Topic -->
        <div class="space-y-2">
          <label class="text-sm font-medium flex gap-2 items-center">
            <div class="i-ph-text-t text-lg" />
            Website Topic
          </label>
          <input
            v-model="formData.topic"
            type="text"
            placeholder="e.g., Quantum Physics Basics, History of Renaissance Art..."
            class="text-sm px-4 py-3 border rounded-lg w-full transition-colors focus:outline-none"
            :class="
              isDark
                ? 'border-stone-600 bg-stone-800/50 text-stone-100 placeholder-stone-500 focus:border-stone-400'
                : 'border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:border-stone-500'
            "
            required
          />
        </div>

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
            class="text-sm px-4 py-3 border rounded-lg w-full transition-colors focus:outline-none"
            :class="
              isDark
                ? 'border-stone-600 bg-stone-800/50 text-stone-100 placeholder-stone-500 focus:border-stone-400'
                : 'border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:border-stone-500'
            "
            required
          />
        </div>

        <!-- Key Sections -->
        <div class="space-y-3">
          <label class="text-sm font-medium flex gap-2 items-center">
            <div class="i ph-list-checks text-lg" />
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
                  ? isDark
                    ? 'border-stone-500 bg-stone-600 text-stone-100'
                    : 'border-stone-600 bg-stone-300 text-stone-900'
                  : isDark
                    ? 'border-stone-600 text-stone-400 hover:border-stone-500 hover:text-stone-300'
                    : 'border-stone-300 text-stone-600 hover:border-stone-400 hover:text-stone-800'
              "
              @click="toggleSection(section.value)"
            >
              {{ section.label }}
            </button>
          </div>
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
                  ? isDark
                    ? 'border-stone-500 bg-stone-900 text-stone-100'
                    : 'border-stone-600 bg-stone-100 text-stone-900'
                  : isDark
                    ? 'border-stone-600 text-stone-400 hover:border-stone-500 hover:text-stone-300'
                    : 'border-stone-300 text-stone-600 hover:border-stone-400 hover:text-stone-800'
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
            <div class="i ph-notebook text-lg" />
            Additional Requirements
          </label>
          <textarea
            v-model="formData.additionalRequirements"
            rows="3"
            placeholder="Any specific features, content requirements, or design preferences..."
            class="text-sm px-4 py-3 border rounded-lg w-full resize-none transition-colors focus:outline-none"
            :class="
              isDark
                ? 'border-stone-600 bg-stone-800/50 text-stone-100 placeholder-stone-500 focus:border-stone-400'
                : 'border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:border-stone-500'
            "
          />
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="text-sm text-white font-medium py-3.5 rounded-lg flex gap-2 w-full transition-colors items-center justify-center"
          :class="
            isDark
              ? 'bg-stone-600 hover:bg-stone-500'
              : 'bg-stone-700 hover:bg-stone-800'
          "
          :disabled="!formData.topic.trim()"
        >
          <div class="i ph-magic-wand text-lg" />
          Generate Website
        </button>
      </form>
    </div>
  </div>
</template>
