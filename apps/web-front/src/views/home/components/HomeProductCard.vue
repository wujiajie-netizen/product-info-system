<script setup lang="ts">
defineProps<{
  image: string;
  name: string;
  price: string;
  priceSuffix: string;
  specs: string[];
  to: string;
}>();
</script>

<template>
  <RouterLink :to="to" class="home-product-card">
    <div class="home-product-card__image-wrap">
      <img :src="image" :alt="name" class="home-product-card__image" />
    </div>

    <div class="home-product-card__body">
      <strong>{{ name }}</strong>
      <p>{{ specs[0] }}</p>
      <p>{{ specs[1] }}</p>
    </div>

    <div class="home-product-card__footer">
      <span class="home-product-card__price">{{ price }}</span>
      <span class="home-product-card__price-suffix">{{ priceSuffix }}</span>
      <span class="home-product-card__favorite" aria-hidden="true">☆</span>
    </div>
  </RouterLink>
</template>

<style scoped>
.home-product-card {
  display: flex;
  flex-direction: column;
  height: 252px;
  overflow: hidden;
  background: linear-gradient(180deg, #fff 0%, #fbfcff 100%);
  border: 1px solid #e7edf6;
  border-radius: 14px;
  box-shadow: 0 8px 22px rgb(18 33 61 / 0.03);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.home-product-card:hover {
  border-color: #d5e3f8;
  box-shadow: 0 18px 36px rgb(18 33 61 / 0.08);
  transform: translateY(-2px);
}

.home-product-card__image-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 125px;
  padding: 12px 10px 8px;
  background:
    radial-gradient(circle at top, rgb(22 100 217 / 0.08), transparent 54%),
    linear-gradient(180deg, #fff 0%, #fbfdff 100%);
}

.home-product-card__image {
  display: block;
  width: 100%;
  max-width: 102px;
  max-height: 82px;
  object-fit: contain;
}

.home-product-card__body {
  flex: 1;
  padding: 0 10px;
}

.home-product-card__body strong {
  display: block;
  min-height: 36px;
  margin-bottom: 6px;
  overflow: hidden;
  font-size: 13px;
  line-height: 1.38;
  color: #12213d;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.home-product-card__body p {
  margin: 0;
  font-size: 11px;
  line-height: 1.45;
  color: #52627d;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.home-product-card__footer {
  display: flex;
  align-items: center;
  padding: 10px 10px 12px;
  font-size: 11px;
}

.home-product-card__price {
  margin-right: 4px;
  font-size: 14px;
  font-weight: 800;
  color: #f05a1a;
}

.home-product-card__price-suffix {
  color: #60708d;
}

.home-product-card__favorite {
  margin-left: auto;
  font-size: 16px;
  line-height: 1;
  color: #95a2ba;
}

@media (max-width: 768px) {
  .home-product-card {
    height: 228px;
  }

  .home-product-card__image-wrap {
    height: 104px;
  }
}
</style>
