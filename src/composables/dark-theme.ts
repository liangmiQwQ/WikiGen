import { useDark, useToggle } from "@vueuse/core";
import { nextTick } from "vue";

const isDark = useDark({
  selector: "html",
  attribute: "class",
  valueDark: "dark",
  valueLight: "",
});

const toggleDark = useToggle(isDark);

function animatedToggleTheme(event: MouseEvent) {
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
    const transition = document.startViewTransition(async () => {
      toggleDark();
      await nextTick();
    });
    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];
      document.documentElement.animate(
        {
          clipPath: isDark.value ? [...clipPath].toReversed() : clipPath,
        },
        {
          duration: 400,
          easing: "ease-in-out",
          fill: "forwards",
          pseudoElement: isDark.value
            ? "::view-transition-old(root)"
            : "::view-transition-new(root)",
        },
      );
    });
  } else {
    toggleDark();
  }
}

export function useDarkTheme() {
  return {
    isDark,
    toggleDark: () => toggleDark(),
    animatedToggleTheme,
  };
}
