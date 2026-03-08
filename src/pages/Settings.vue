<script setup lang="ts">
import { computed } from "vue";
import { useSettings } from "../composables/settings";

const { settings, updateApiKey, resetSettings } = useSettings();

const theme = {
  card: "bg-stone-100 border-stone-200 dark:bg-stone-900 dark:border-stone-800",
  title: "text-stone-900 dark:text-stone-100",
  subtitle: "text-stone-900 dark:text-stone-200",
  label: "text-stone-700 dark:text-stone-300",
  input:
    "bg-stone-100 border-stone-300 text-stone-900 focus:border-stone-500 placeholder-stone-400 dark:bg-stone-900 dark:border-stone-700 dark:text-stone-200 dark:placeholder-stone-500",
  hint: "text-stone-500",
  link: "text-stone-600 dark:text-stone-400",
  button:
    "bg-stone-200 border-stone-300 text-stone-700 hover:bg-stone-300 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-200",
  divider: "border-stone-200 dark:border-stone-800",
};

const currentApiKey = computed({
  get: () => settings.value.apiKeys.deepseek,
  set: (value: string) => {
    updateApiKey("deepseek", value);
  },
});
</script>

<template>
  <div class="mx-auto p-4 max-w-3xl md:p-8">
    <div class="mb-6 p-6 border rounded-lg" :class="theme.card">
      <h1 class="text-xl font-semibold mb-6 md:text-2xl" :class="theme.title">
        Settings
      </h1>

      <div class="mb-8">
        <h2
          class="text-base font-semibold mb-4 pb-3 border-b"
          :class="[theme.subtitle, theme.divider]"
        >
          AI Model
        </h2>

        <div class="mb-6">
          <label class="text-sm font-medium mb-2 block" :class="theme.label">
            DeepSeek API Key
          </label>
          <input
            v-model="currentApiKey"
            type="password"
            placeholder="Enter your API key"
            class="text-sm px-3.5 py-2.5 border rounded-lg w-full focus:outline-none"
            :class="theme.input"
          />
          <p class="text-xs mt-2" :class="theme.hint">
            Your API key is stored locally in your browser
          </p>
          <div class="mt-2">
            <a
              href="https://platform.deepseek.com/"
              target="_blank"
              rel="noopener"
              class="text-xs hover:underline"
              :class="theme.link"
            >
              Get DeepSeek API Key →
            </a>
          </div>
        </div>
      </div>

      <div>
        <h2
          class="text-base font-semibold mb-4 pb-3 border-b"
          :class="[theme.subtitle, theme.divider]"
        >
          Data Management
        </h2>
        <div class="mb-4">
          <button
            class="text-sm font-medium px-4 py-2 border rounded-lg"
            :class="theme.button"
            @click="resetSettings"
          >
            Reset All Settings
          </button>
          <p class="text-xs mt-2" :class="theme.hint">
            This will reset all settings to their default values
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
