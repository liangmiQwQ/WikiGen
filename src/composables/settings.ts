import { useStorage } from "@vueuse/core";
import { computed, nextTick } from "vue";
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

  const isDark = computed(() => settings.value.theme === "dark");

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

  function toggleTheme(event: MouseEvent) {
    const toggleDark = () => {
      settings.value.theme = isDark.value ? "light" : "dark";
    };

    if (
      "startViewTransition" in document &&
      globalThis.matchMedia("(prefers-reduced-motion: no-preference)").matches
    ) {
      const x = event.clientX;
      const y = event.clientY;
      const endRadius = Math.hypot(
        Math.max(x, innerWidth - x),
        Math.max(y, innerHeight - y),
      );
      const transition = document.startViewTransition!(async () => {
        toggleDark();
        await nextTick();
      });
      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 400,
            easing: "ease-in-out",
            fill: "forwards",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      });
    } else {
      toggleDark();
    }
  }

  return {
    settings,
    isDark,
    updateProvider,
    updateApiKey,
    updateTheme,
    toggleTheme,
    resetSettings,
  };
}
