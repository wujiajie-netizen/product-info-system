<script lang="ts" setup>
import type { ProfileRecord, UserRole } from '#/api';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  ElCard,
  ElEmpty,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { listProfiles, updateProfileRole } from '#/api';

const userStore = useUserStore();
const loading = ref(false);
const users = ref<ProfileRecord[]>([]);

const isAdmin = computed(() => userStore.userRoles.includes('admin'));

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

async function loadUsers() {
  try {
    loading.value = true;
    users.value = await listProfiles();
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    loading.value = false;
  }
}

async function handleRoleChange(row: ProfileRecord, role: UserRole) {
  try {
    await updateProfileRole(row.id, role);
    ElMessage.success('角色已更新');
    await loadUsers();
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

onMounted(loadUsers);
</script>

<template>
  <Page
    description="MVP 阶段使用 admin / user 两类角色控制读写权限"
    title="用户权限"
  >
    <ElCard shadow="never">
      <ElTable v-loading="loading" :data="users" stripe>
        <ElTableColumn label="姓名" min-width="160" prop="name" />
        <ElTableColumn label="邮箱" min-width="220" prop="email" />
        <ElTableColumn label="角色" prop="role" width="180">
          <template #default="{ row }">
            <ElSelect
              v-if="isAdmin"
              :model-value="row.role"
              size="small"
              @change="(role: UserRole) => handleRoleChange(row, role)"
            >
              <ElOption label="管理员" value="admin" />
              <ElOption label="普通用户" value="user" />
            </ElSelect>
            <ElTag v-else type="primary">{{ row.role }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="创建时间" width="140">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </ElTableColumn>
        <template #empty>
          <ElEmpty description="暂无用户资料" />
        </template>
      </ElTable>
    </ElCard>
  </Page>
</template>
