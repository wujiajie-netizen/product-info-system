<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

interface Props {
  option: Record<string, any>;
}

defineOptions({
  name: 'DashboardChart',
});

const props = defineProps<Props>();

const chartRef = ref<EchartsUIType>();
const { renderEcharts, updateData } = useEcharts(chartRef);

onMounted(async () => {
  await renderEcharts(props.option);
});

watch(
  () => props.option,
  async (option) => {
    if (Object.keys(option || {}).length === 0) {
      return;
    }

    await updateData(option, true);
  },
  { deep: true },
);
</script>

<template>
  <EchartsUI ref="chartRef" class="h-full w-full" />
</template>
