<script setup lang="ts"></script>

<template>
  <nav>
    <RouterLink to="/">Home</RouterLink>
    <RouterLink to="/about">About</RouterLink>
  </nav>
  <main>
    <RouterView />
  </main>
</template>

<style scoped>
nav {
  padding: 1rem;
  display: flex;
  gap: 1rem;
}

nav a {
  text-decoration: none;
  color: #333;
}

nav a.router-link-active {
  font-weight: bold;
  color: #42b883;
}

main {
  padding: 1rem;
}
</style>
