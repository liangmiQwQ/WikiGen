import { useStorage } from "@vueuse/core";
import type { AIProvider, ApiKeys, Settings } from "../types";

const defaultApiKeys: ApiKeys = {
  deepseek: "",
};

const defaultSettings: Settings = {
  apiKeys: { ...defaultApiKeys },
};

function migrateFromOldFormat(storedValue: unknown): Settings {
  const value = storedValue as {
    provider?: string;
    apiKey?: string;
    apiKeys?: Record<string, string>;
  };

  if (storedValue && typeof storedValue.apiKey === "string") {
    return {
      apiKeys: {
        ...defaultApiKeys,
        deepseek: value.apiKey ?? "",
      },
    };
  }

  if (value?.apiKeys) {
    return {
      apiKeys: {
        ...defaultApiKeys,
        deepseek: value.apiKeys.deepseek || value.apiKeys["moonshot-cn"] || "",
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

  function updateApiKey(provider: AIProvider, apiKey: string) {
    settings.value.apiKeys[provider] = apiKey;
  }

  function getCurrentApiKey(): string {
    return settings.value.apiKeys.deepseek || "";
  }

  function resetSettings() {
    settings.value = { ...defaultSettings };
  }

  return {
    settings,
    updateApiKey,
    getCurrentApiKey,
    resetSettings,
  };
}
