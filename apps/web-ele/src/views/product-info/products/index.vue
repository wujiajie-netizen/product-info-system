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

const products = [
  {
    id: 1,
    category: 'LCD',
    model: 'LCD-240128',
    name: '240x128 图形点阵屏',
    status: '在售',
    updatedAt: '2026-04-29',
  },
  {
    id: 2,
    category: 'OLED',
    model: 'OLED-096',
    name: '0.96 寸 OLED 模组',
    status: '新品',
    updatedAt: '2026-04-28',
  },
  {
    id: 3,
    category: 'TFT',
    model: 'TFT-240320',
    name: '2.4 寸 TFT 显示屏',
    status: '在售',
    updatedAt: '2026-04-26',
  },
];
</script>

<template>
  <Page description="维护产品分类、型号、名称和规格参数" title="产品管理">
    <ElCard shadow="never">
      <ElSpace class="mb-4" wrap>
        <ElInput placeholder="搜索型号、名称、分类" style="width: 320px" />
        <ElButton type="primary">新增产品</ElButton>
      </ElSpace>
      <ElTable :data="products" stripe>
        <ElTableColumn label="产品型号" prop="model" width="160" />
        <ElTableColumn label="产品名称" min-width="220" prop="name" />
        <ElTableColumn label="分类" prop="category" width="120" />
        <ElTableColumn label="状态" prop="status" width="100">
          <template #default="{ row }">
            <ElTag type="success">{{ row.status }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="更新时间" prop="updatedAt" width="140" />
      </ElTable>
    </ElCard>
  </Page>
</template>
