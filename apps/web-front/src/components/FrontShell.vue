<script setup lang="ts">
</script>

<template>
  <div class="front-shell">
    <main class="front-shell-main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.front-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgb(39 103 205 / 0.08), transparent 28%),
    linear-gradient(180deg, #f7faff 0%, #f5f8fd 100%);
}

.front-shell-main {
  display: block;
}
</style>
