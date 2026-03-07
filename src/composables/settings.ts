import { useStorage } from "@vueuse/core";
import type { AIProvider, ApiKeys, Settings } from "../types";

const defaultApiKeys: ApiKeys = {
  deepseek: "",
  "moonshot-cn": "",
  moonshot: "",
};

const defaultSettings: Settings = {
  provider: "deepseek",
  apiKeys: { ...defaultApiKeys },
};

function migrateFromOldFormat(storedValue: any): Settings {
  // Check if it's the old format with single apiKey
  if (storedValue && typeof storedValue.apiKey === "string") {
    const oldProvider = storedValue.provider as string;
    const oldApiKey = storedValue.apiKey as string;

    // Handle old "kimi" provider
    const newProvider: AIProvider =
      oldProvider === "kimi" || oldProvider === "default"
        ? "deepseek"
        : (oldProvider as AIProvider);

    // Migrate to new format
    const newSettings: Settings = {
      provider: newProvider,
      apiKeys: { ...defaultApiKeys },
    };

    // Migrate old apiKey to appropriate provider
    if (oldProvider === "deepseek" && oldApiKey) {
      newSettings.apiKeys.deepseek = oldApiKey;
    } else if (oldProvider === "kimi" && oldApiKey) {
      newSettings.apiKeys["moonshot-cn"] = oldApiKey;
    }

    return newSettings;
  }

  // Check if apiKeys object exists but is missing some keys
  if (storedValue && storedValue.apiKeys) {
    // Handle "default" provider from old storage
    const provider = storedValue.provider;
    const validProvider: AIProvider =
      provider === "default" || !provider ? "deepseek" : provider;

    return {
      provider: validProvider,
      apiKeys: {
        ...defaultApiKeys,
        ...storedValue.apiKeys,
      },
    };
  }

  return { ...defaultSettings };
}

export function useSettings() {
  const settings = useStorage<Settings>(
    "wikigen-settings",
    defaultSettings,
    localStorage,
  );

  // Migrate old format on initialization
  const migrated = migrateFromOldFormat(settings.value);
  if (JSON.stringify(migrated) !== JSON.stringify(settings.value)) {
    settings.value = migrated;
  }

  function updateProvider(provider: AIProvider) {
    settings.value.provider = provider;
  }

  function updateApiKey(provider: AIProvider, apiKey: string) {
    settings.value.apiKeys[provider] = apiKey;
  }

  function getCurrentApiKey(): string {
    return settings.value.apiKeys[settings.value.provider] || "";
  }

  function resetSettings() {
    settings.value = { ...defaultSettings };
  }

  return {
    settings,
    updateProvider,
    updateApiKey,
    getCurrentApiKey,
    resetSettings,
  };
}
