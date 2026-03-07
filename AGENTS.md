# WikiGen Agent Guide

WikiGen is a web application that can generate different kinds of webpage based on user input.

## Project Setup

`pnpm` is the package manager. We use `eslint` and `@antfu/eslint-config` to lint and format code. No tests for now.

Run `pnpm run lint:fix` and `pnpm run typecheck` after modifying code. And fix the errors if possible before telling me you've finished the task.

This project use UnoCSS for styling. We use `wind4` present and enabled `presetAttributify` and `transformerVariantGroup`. Load UnoCSS skills if you want to modify styles to use the preset and transformer correctly and as much as possible.

This project use `vue@3.5` stable version with standard compiler.

## UI Guidelines

- **Icons**: Use Phosphor icons via UnoCSS (e.g., `i-ph-chat`, `i-ph-gear`). Available icons: https://icones.js.org/collection/ph
- **Responsive**: Design for both mobile and desktop simultaneously using responsive breakpoints
- **No emojis**: Use icons instead of emojis throughout the UI
- **Theme color**: Use UnoCSS `stone` color as theme color.
