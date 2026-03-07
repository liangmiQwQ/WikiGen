<script setup lang="ts">
import { useDarkTheme } from "../composables/dark-theme";
import { useSettings } from "../composables/settings";
import type { AIProvider } from "../types";

const { settings, updateProvider, updateApiKey, resetSettings } = useSettings();
const { isDark } = useDarkTheme();

const providers: { value: AIProvider; label: string }[] = [
  { value: "deepseek", label: "DeepSeek" },
  { value: "kimi", label: "Kimi (Moonshot AI)" },
];

function handleProviderChange(e: Event) {
  const target = e.target as HTMLSelectElement;
  updateProvider(target.value as AIProvider);
}

function handleApiKeyChange(e: Event) {
  const target = e.target as HTMLInputElement;
  updateApiKey(target.value);
}
</script>

<template>
  <div class="mx-auto p-4 max-w-3xl md:p-8">
    <div
      class="mb-6 p-6 border rounded-lg"
      :class="
        isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
      "
    >
      <h1
        class="text-xl font-semibold mb-6 md:text-2xl"
        :class="isDark ? 'text-stone-100' : 'text-stone-900'"
      >
        Settings
      </h1>

      <div class="mb-8">
        <h2
          class="text-base font-semibold mb-4 pb-3 border-b"
          :class="
            isDark
              ? 'text-stone-200 border-stone-800'
              : 'text-stone-900 border-stone-200'
          "
        >
          AI Provider
        </h2>

        <div class="mb-6">
          <label
            class="text-sm font-medium mb-2 block"
            :class="isDark ? 'text-stone-300' : 'text-stone-700'"
            >Select Provider</label
          >
          <select
            :value="settings.provider"
            class="text-sm px-3.5 py-2.5 border rounded-lg w-full focus:outline-none"
            :class="
              isDark
                ? 'bg-stone-900 border-stone-700 text-stone-200 focus:border-stone-500'
                : 'bg-white border-stone-300 text-stone-900 focus:border-stone-500'
            "
            @change="handleProviderChange"
          >
            <option
              v-for="provider in providers"
              :key="provider.value"
              :value="provider.value"
            >
              {{ provider.label }}
            </option>
          </select>
          <p
            class="text-xs mt-2"
            :class="isDark ? 'text-stone-500' : 'text-stone-500'"
          >
            Choose your preferred AI service for generating websites
          </p>
        </div>

        <div class="mb-6">
          <label
            class="text-sm font-medium mb-2 block"
            :class="isDark ? 'text-stone-300' : 'text-stone-700'"
            >API Key</label
          >
          <input
            type="password"
            :value="settings.apiKey"
            placeholder="Enter your API key"
            class="text-sm px-3.5 py-2.5 border rounded-lg w-full focus:outline-none"
            :class="
              isDark
                ? 'bg-stone-900 border-stone-700 text-stone-200 placeholder-stone-600 focus:border-stone-500'
                : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus:border-stone-500'
            "
            @input="handleApiKeyChange"
          />
          <p
            class="text-xs mt-2"
            :class="isDark ? 'text-stone-500' : 'text-stone-500'"
          >
            Your API key is stored locally in your browser
          </p>
          <div class="mt-2">
            <a
              v-if="settings.provider === 'deepseek'"
              href="https://platform.deepseek.com/"
              target="_blank"
              rel="noopener"
              class="text-xs hover:underline"
              :class="isDark ? 'text-stone-400' : 'text-stone-600'"
            >
              Get DeepSeek API Key →
            </a>
            <a
              v-else
              href="https://platform.moonshot.cn/"
              target="_blank"
              rel="noopener"
              class="text-xs hover:underline"
              :class="isDark ? 'text-stone-400' : 'text-stone-600'"
            >
              Get Kimi API Key →
            </a>
          </div>
        </div>
      </div>

      <div>
        <h2
          class="text-base font-semibold mb-4 pb-3 border-b"
          :class="
            isDark
              ? 'text-stone-200 border-stone-800'
              : 'text-stone-900 border-stone-200'
          "
        >
          Data Management
        </h2>
        <div class="mb-4">
          <button
            class="text-sm font-medium px-4 py-2 border rounded-lg"
            :class="
              isDark
                ? 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700 hover:text-stone-200'
                : 'bg-stone-100 border-stone-300 text-stone-700 hover:bg-stone-200'
            "
            @click="resetSettings"
          >
            Reset All Settings
          </button>
          <p
            class="text-xs mt-2"
            :class="isDark ? 'text-stone-500' : 'text-stone-500'"
          >
            This will reset all settings to their default values
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
