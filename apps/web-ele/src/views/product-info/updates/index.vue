<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElCard,
  ElInput,
  ElSpace,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

const updates = [
  {
    id: 1,
    content: '上传新版报价单后自动生成',
    model: 'LCD-240128',
    title: 'LCD-240128 价格更新',
    type: 'price_update',
    updatedAt: '2026-04-29',
  },
  {
    id: 2,
    content: '新增 OLED-096 规格书和图片',
    model: 'OLED-096',
    title: 'OLED-096 资料补充',
    type: 'product',
    updatedAt: '2026-04-28',
  },
  {
    id: 3,
    content: '销售团队同步本周重点型号',
    model: '-',
    title: '本周内部通知',
    type: 'notice',
    updatedAt: '2026-04-27',
  },
];
</script>

<template>
  <Page description="同步报价更新、新品发布和内部通知" title="动态管理">
    <ElCard shadow="never">
      <ElSpace class="mb-4" wrap>
        <ElInput placeholder="搜索动态、型号、内容" style="width: 320px" />
        <ElButton type="primary">发布动态</ElButton>
      </ElSpace>
      <ElTable :data="updates" stripe>
        <ElTableColumn label="动态标题" min-width="220" prop="title" />
        <ElTableColumn label="类型" prop="type" width="140">
          <template #default="{ row }">
            <ElTag type="warning">{{ row.type }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="关联型号" prop="model" width="160" />
        <ElTableColumn label="内容摘要" min-width="220" prop="content" />
        <ElTableColumn label="更新时间" prop="updatedAt" width="140" />
      </ElTable>
    </ElCard>
  </Page>
</template>
