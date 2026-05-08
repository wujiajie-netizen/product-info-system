<script setup lang="ts">
import { computed } from 'vue';
import { NTimelineItem } from 'naive-ui';
import { RouterLink } from 'vue-router';

import type { UpdateTimelineItem } from '#/views/update/update-data';

const props = defineProps<{
  item: UpdateTimelineItem;
}>();

const timeLines = computed(() => props.item.timeLabel.split('\n'));
</script>

<template>
  <n-timeline-item class="timeline-item" type="info">
    <template #icon>
      <span class="timeline-item__dot"></span>
    </template>

    <template #header>
      <div class="timeline-item__time">
        <span v-for="line in timeLines" :key="line">{{ line }}</span>
      </div>
    </template>

    <div class="timeline-item__main">
      <span class="timeline-item__tag" :class="`is-${item.tone}`">
        {{ item.tagLabel }}
      </span>

      <div class="timeline-item__thumb">
        <img :src="item.image" :alt="item.title" loading="lazy" />
      </div>

      <div class="timeline-item__content">
        <h3>{{ item.title }}</h3>
        <p>{{ item.description }}</p>
        <span>{{ item.summary }}</span>
      </div>

      <div class="timeline-item__meta">
        <strong>{{ item.relatedLabel }}</strong>
        <span v-if="item.relatedValue">{{ item.relatedValue }}</span>
      </div>

      <RouterLink :to="item.to" class="timeline-item__button">
        查看详情
      </RouterLink>
    </div>
  </n-timeline-item>
</template>

<style scoped>
.timeline-item {
  position: relative;
  display: grid;
  grid-template-columns: 28px 72px minmax(0, 1fr);
  gap: 0 16px;
}

.timeline-item :deep(.n-timeline-item-timeline) {
  grid-column: 1;
  grid-row: 1 / span 2;
  width: 28px;
}

.timeline-item :deep(.n-timeline-item-timeline__line) {
  width: 1px;
  background: linear-gradient(180deg, #c8dcff 0%, #edf3fc 100%);
}

.timeline-item__dot {
  display: block;
  width: 10px;
  height: 10px;
  background: #1f70ff;
  border: 3px solid #edf4ff;
  border-radius: 999px;
  box-shadow: 0 0 0 4px rgb(31 112 255 / 0.08);
}

.timeline-item :deep(.n-timeline-item-content) {
  display: contents;
}

.timeline-item :deep(.n-timeline-item-content__title) {
  grid-column: 2;
  padding-top: 4px;
  margin: 0;
}

.timeline-item__time {
  display: grid;
  gap: 4px;
  align-content: start;
  padding-top: 4px;
  font-size: 14px;
  line-height: 1.15;
  color: #4d6280;
}

.timeline-item :deep(.n-timeline-item-content__content) {
  grid-column: 3;
}

.timeline-item :deep(.n-timeline-item-content__meta) {
  display: none;
}

.timeline-item__main {
  display: grid;
  grid-template-columns: auto 92px minmax(0, 1fr) auto auto;
  gap: 12px;
  align-items: center;
  padding: 6px 0 10px;
}

.timeline-item__tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 58px;
  height: 24px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 8px;
}

.timeline-item__tag.is-blue {
  color: #1664d9;
  background: #eef4ff;
}

.timeline-item__tag.is-green {
  color: #18a36d;
  background: #ebf9f1;
}

.timeline-item__tag.is-orange {
  color: #f05a1a;
  background: #fff3eb;
}

.timeline-item__tag.is-teal {
  color: #0f9488;
  background: #ebf8f7;
}

.timeline-item__thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 84px;
  height: 60px;
  overflow: hidden;
  background: linear-gradient(180deg, #f9fbff 0%, #eff4fb 100%);
  border: 1px solid #e5ecf6;
  border-radius: 12px;
}

.timeline-item__thumb img {
  display: block;
  width: 62px;
  height: 62px;
  object-fit: contain;
}

.timeline-item__content {
  min-width: 0;
}

.timeline-item__content h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #12213d;
}

.timeline-item__content p,
.timeline-item__content span {
  display: block;
  margin: 6px 0 0;
  font-size: 14px;
  line-height: 1.55;
  color: #60708d;
}

.timeline-item__meta {
  display: grid;
  gap: 6px;
  justify-items: end;
  min-width: 112px;
  font-size: 14px;
  color: #60708d;
  text-align: right;
}

.timeline-item__meta strong {
  font-weight: 600;
  color: #6e7f9b;
}

.timeline-item__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 102px;
  height: 36px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 700;
  color: #1664d9;
  background: #fff;
  border: 1px solid #d9e6f7;
  border-radius: 10px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.timeline-item__button:hover {
  border-color: #adcaf6;
  box-shadow: 0 10px 20px rgb(22 100 217 / 0.08);
  transform: translateY(-1px);
}

@media (max-width: 1200px) {
  .timeline-item__main {
    grid-template-columns: auto 84px minmax(0, 1fr);
    gap: 14px;
  }

  .timeline-item__meta,
  .timeline-item__button {
    grid-column: 3;
    justify-self: start;
    text-align: left;
  }

  .timeline-item__meta {
    justify-items: start;
    min-width: 0;
  }
}

@media (max-width: 768px) {
  .timeline-item {
    grid-template-columns: 28px minmax(0, 1fr);
  }

  .timeline-item :deep(.n-timeline-item-content__title) {
    grid-column: 2;
    padding-top: 0;
    margin-bottom: 8px;
  }

  .timeline-item :deep(.n-timeline-item-content__content) {
    grid-column: 2;
  }

  .timeline-item__main {
    grid-template-columns: auto 72px minmax(0, 1fr);
  }

  .timeline-item__tag {
    grid-column: 1 / -1;
    justify-self: start;
  }
}

@media (max-width: 640px) {
  .timeline-item__main {
    grid-template-columns: 1fr;
  }

  .timeline-item__thumb {
    width: 100%;
    max-width: 104px;
    height: 80px;
  }

  .timeline-item__meta,
  .timeline-item__button {
    grid-column: auto;
  }
}
</style>
