<script setup lang="ts">
import { useSettings } from "../composables/use-settings";
import type { AIProvider } from "../types";

const { settings, updateProvider, updateApiKey, resetSettings } = useSettings();

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
    <div class="mb-6 p-6 border border-gray-200 rounded-lg bg-white">
      <h1 class="text-xl text-gray-900 font-semibold mb-6 md:text-2xl">
        Settings
      </h1>

      <div class="mb-8">
        <h2
          class="text-base text-gray-900 font-semibold mb-4 pb-3 border-b border-gray-200"
        >
          AI Provider
        </h2>

        <div class="mb-6">
          <label class="text-sm text-gray-700 font-medium mb-2 block"
            >Select Provider</label
          >
          <select
            :value="settings.provider"
            class="text-sm px-3.5 py-2.5 border border-gray-300 rounded-lg bg-white w-full focus:outline-none focus:border-blue-600"
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
          <p class="text-xs text-gray-500 mt-2">
            Choose your preferred AI service for generating websites
          </p>
        </div>

        <div class="mb-6">
          <label class="text-sm text-gray-700 font-medium mb-2 block"
            >API Key</label
          >
          <input
            type="password"
            :value="settings.apiKey"
            placeholder="Enter your API key"
            class="text-sm px-3.5 py-2.5 border border-gray-300 rounded-lg w-full focus:outline-none focus:border-blue-600"
            @input="handleApiKeyChange"
          />
          <p class="text-xs text-gray-500 mt-2">
            Your API key is stored locally in your browser
          </p>
          <div class="mt-2">
            <a
              v-if="settings.provider === 'deepseek'"
              href="https://platform.deepseek.com/"
              target="_blank"
              rel="noopener"
              class="text-xs text-blue-600 hover:underline"
            >
              Get DeepSeek API Key →
            </a>
            <a
              v-else
              href="https://platform.moonshot.cn/"
              target="_blank"
              rel="noopener"
              class="text-xs text-blue-600 hover:underline"
            >
              Get Kimi API Key →
            </a>
          </div>
        </div>
      </div>

      <div>
        <h2
          class="text-base text-gray-900 font-semibold mb-4 pb-3 border-b border-gray-200"
        >
          Data Management
        </h2>
        <div class="mb-4">
          <button
            class="text-sm text-gray-700 font-medium px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 hover:bg-gray-200"
            @click="resetSettings"
          >
            Reset All Settings
          </button>
          <p class="text-xs text-gray-500 mt-2">
            This will reset all settings to their default values
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
