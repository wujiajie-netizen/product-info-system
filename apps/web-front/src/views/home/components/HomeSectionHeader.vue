<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    linkLabel?: string;
    linkTo?: string;
  }>(),
  {
    subtitle: '',
    linkLabel: '',
    linkTo: '',
  },
);
</script>

<template>
  <div class="home-section-header">
    <div>
      <h2>{{ title }}</h2>
      <p v-if="subtitle">{{ subtitle }}</p>
    </div>
    <RouterLink
      v-if="linkLabel && linkTo"
      :to="linkTo"
      class="home-section-header__link"
    >
      {{ linkLabel }}
    </RouterLink>
  </div>
</template>

<style scoped>
.home-section-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
}

.home-section-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
  color: #12213d;
}

.home-section-header p {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: #60708d;
}

.home-section-header__link {
  display: inline-flex;
  align-items: center;
  padding-top: 3px;
  font-size: 15px;
  font-weight: 600;
  color: #1664d9;
}

.home-section-header__link::after {
  margin-left: 4px;
  content: '›';
  font-size: 17px;
}

@media (max-width: 768px) {
  .home-section-header {
    align-items: center;
  }

  .home-section-header h2 {
    font-size: 18px;
  }

  .home-section-header p {
    display: none;
  }
}
</style>
