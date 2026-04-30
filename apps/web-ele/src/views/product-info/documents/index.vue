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

const documents = [
  {
    id: 1,
    category: 'LCD',
    fileType: '报价单',
    model: 'LCD-240128',
    title: 'LCD-240128 报价单 2026-04',
    updatedAt: '2026-04-29',
  },
  {
    id: 2,
    category: 'OLED',
    fileType: '规格书',
    model: 'OLED-096',
    title: 'OLED-096 Spec Sheet',
    updatedAt: '2026-04-28',
  },
  {
    id: 3,
    category: 'TFT',
    fileType: '图片',
    model: 'TFT-240320',
    title: 'TFT-240320 产品图片',
    updatedAt: '2026-04-26',
  },
];
</script>

<template>
  <Page description="统一管理报价单、规格书、图片和技术资料" title="文件资料">
    <ElCard shadow="never">
      <ElSpace class="mb-4" wrap>
        <ElInput placeholder="搜索标题、型号、标签" style="width: 320px" />
        <ElButton type="primary">上传文件</ElButton>
      </ElSpace>
      <ElTable :data="documents" stripe>
        <ElTableColumn label="文件标题" min-width="260" prop="title" />
        <ElTableColumn label="关联型号" prop="model" width="160" />
        <ElTableColumn label="文件类型" prop="fileType" width="120">
          <template #default="{ row }">
            <ElTag type="primary">{{ row.fileType }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="分类" prop="category" width="120" />
        <ElTableColumn label="更新时间" prop="updatedAt" width="140" />
      </ElTable>
    </ElCard>
  </Page>
</template>
