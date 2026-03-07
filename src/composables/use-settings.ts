import { useStorage } from "@vueuse/core";
import type { AIProvider, Settings } from "../types";

const defaultSettings: Settings = {
  provider: "deepseek",
  apiKey: "",
  theme: "light",
};

export function useSettings() {
  const settings = useStorage<Settings>(
    "wikigen-settings",
    defaultSettings,
    localStorage,
  );

  function updateProvider(provider: AIProvider) {
    settings.value.provider = provider;
  }

  function updateApiKey(apiKey: string) {
    settings.value.apiKey = apiKey;
  }

  function updateTheme(theme: "light" | "dark") {
    settings.value.theme = theme;
  }

  function resetSettings() {
    settings.value = { ...defaultSettings };
  }

  return {
    settings,
    updateProvider,
    updateApiKey,
    updateTheme,
    resetSettings,
  };
}
