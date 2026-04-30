<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import {
  ElCard,
  ElCol,
  ElRow,
  ElStatistic,
  ElTable,
  ElTableColumn,
  ElTag,
  ElTimeline,
  ElTimelineItem,
} from 'element-plus';

const latestUpdates = [
  {
    id: 1,
    model: 'P3-12864',
    title: 'P3 系列报价单更新',
    type: '价格更新',
    updatedAt: '2026-04-29',
  },
  {
    id: 2,
    model: 'LCD-240128',
    title: '新增规格书与产品图片',
    type: '资料更新',
    updatedAt: '2026-04-28',
  },
  {
    id: 3,
    model: 'OLED-096',
    title: '新品资料待销售确认',
    type: '新品发布',
    updatedAt: '2026-04-27',
  },
];

const steps = [
  '建立 products / documents / updates 数据表',
  '完成产品和文件资料管理页面',
  '接入 Supabase Auth 与角色权限',
  '优化搜索、标签和动态同步机制',
];
</script>

<template>
  <Page
    description="产品、文件、报价动态和内部权限的统一入口"
    title="产品资料工作台"
  >
    <ElRow :gutter="16">
      <ElCol :lg="6" :md="12" :xs="24">
        <ElCard class="mb-4" shadow="never">
          <ElStatistic title="产品型号" :value="128" />
        </ElCard>
      </ElCol>
      <ElCol :lg="6" :md="12" :xs="24">
        <ElCard class="mb-4" shadow="never">
          <ElStatistic title="文件资料" :value="426" />
        </ElCard>
      </ElCol>
      <ElCol :lg="6" :md="12" :xs="24">
        <ElCard class="mb-4" shadow="never">
          <ElStatistic title="本周动态" :value="18" />
        </ElCard>
      </ElCol>
      <ElCol :lg="6" :md="12" :xs="24">
        <ElCard class="mb-4" shadow="never">
          <ElStatistic title="待整理资料" :value="9" />
        </ElCard>
      </ElCol>
    </ElRow>

    <ElRow :gutter="16">
      <ElCol :lg="16" :xs="24">
        <ElCard class="mb-4" shadow="never">
          <template #header>最新动态</template>
          <ElTable :data="latestUpdates" stripe>
            <ElTableColumn label="动态标题" min-width="220" prop="title" />
            <ElTableColumn label="关联型号" prop="model" width="160" />
            <ElTableColumn label="类型" prop="type" width="120">
              <template #default="{ row }">
                <ElTag type="primary">{{ row.type }}</ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="更新时间" prop="updatedAt" width="140" />
          </ElTable>
        </ElCard>
      </ElCol>
      <ElCol :lg="8" :xs="24">
        <ElCard class="mb-4" shadow="never">
          <template #header>MVP 落地顺序</template>
          <ElTimeline>
            <ElTimelineItem v-for="step in steps" :key="step">
              {{ step }}
            </ElTimelineItem>
          </ElTimeline>
        </ElCard>
      </ElCol>
    </ElRow>
  </Page>
</template>
