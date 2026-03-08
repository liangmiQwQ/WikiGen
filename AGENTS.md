# WikiGen Agent Guide

WikiGen is an AI agent web application where chat is the core workspace and website generation is one artifact of each run.

## Project Setup

`pnpm` is the package manager. We use `eslint` and `@antfu/eslint-config` to lint and format code. No tests for now.

Run `pnpm run lint:fix` and `pnpm run typecheck` after modifying code. And fix the errors if possible before telling me you've finished the task.

This project use UnoCSS for styling. We use `wind4` present and enabled `presetAttributify` and `transformerVariantGroup`. Load UnoCSS skills if you want to modify styles to use the preset and transformer correctly and as much as possible.

This project use `vue@3.5` stable version with standard compiler.
AI provider is DeepSeek-only. Keep model prompts in dedicated files under `src/prompts/` instead of inline component/composable strings.

Keep AGENTS.md updated with the project codebase. Consider if there is need to modify AGENTS.md after your changes. Don't write something weird like project structure or project status in AGENTS.md.

## UI Guidelines

- **Icons**: Use Phosphor icons via UnoCSS (e.g., `i-ph-chat`, `i-ph-gear`). Available icons: https://icones.js.org/collection/ph
- **Responsive**: Design for both mobile and desktop simultaneously using responsive breakpoints
- **No emojis**: Use icons instead of emojis throughout the UI
- **Theme color**: Use UnoCSS `stone` color as theme color.
- **Background color**: Use `bg-stone-100` or `bg-stone-200` and avoid `300` or darker color in light mode if possible; Use `bg-stone-900` or `bg-stone-800` and avoid `700` or lighter in dark mode if possible.
