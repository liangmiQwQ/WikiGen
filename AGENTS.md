# WikiGen Agent Guide

WikiGen is a web application that can generate different kinds of webpage based on user input.

## Project Setup

`pnpm` is the package manager. We use `eslint` and `@antfu/eslint-config` to lint code. We use `oxfmt` to format code. No tests for now.

Run `pnpm run lint`, `pnpm run fmt` and `pnpm run typecheck` after modifying code. And fix the errors if possible before telling me you've finished the task.

This project use UnoCSS for styling. We use `wind4` present and enabled `presetAttributify` and `transformerVariantGroup`. Load UnoCSS skills if you want to modify styles to use the preset and transformer correctly and as much as possible.

This project use `vue@3.6.0-beta` to enable vapor mode. Please make sure all components you created has a `vapor` flag like `<script setup vapor>`.
