<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElCard,
  ElSpace,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

const users = [
  {
    id: 1,
    email: 'admin@example.com',
    name: '系统管理员',
    role: 'admin',
    status: '启用',
  },
  {
    id: 2,
    email: 'sales@example.com',
    name: '销售用户',
    role: 'user',
    status: '启用',
  },
];
</script>

<template>
  <Page
    description="MVP 阶段使用 admin / user 两类角色控制读写权限"
    title="用户权限"
  >
    <ElCard shadow="never">
      <ElSpace class="mb-4" wrap>
        <ElButton type="primary">邀请用户</ElButton>
      </ElSpace>
      <ElTable :data="users" stripe>
        <ElTableColumn label="姓名" prop="name" />
        <ElTableColumn label="邮箱" min-width="220" prop="email" />
        <ElTableColumn label="角色" prop="role" width="120">
          <template #default="{ row }">
            <ElTag type="primary">{{ row.role }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" prop="status" width="100">
          <template #default="{ row }">
            <ElTag type="success">{{ row.status }}</ElTag>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>
  </Page>
</template>
