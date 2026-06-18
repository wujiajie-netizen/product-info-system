<script lang="ts" setup>
import type { BrandRecord, CategoryRecord, CompanyRecord, ProductRecord, SaveQuoteTierInput } from '@/api';

import { computed, onMounted, reactive, ref } from 'vue';

import { useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElCard,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
  ElSpace,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  createProduct,
  createQuote,
  listBrands,
  listCategories,
  listCompanies,
} from '@/api';

const userStore = useUserStore();
const isAdmin = computed(() => userStore.userRoles.includes('admin'));

const saving = ref(false);
const categories = ref<CategoryRecord[]>([]);
const brands = ref<BrandRecord[]>([]);
const companies = ref<CompanyRecord[]>([]);
const createdProduct = ref<ProductRecord>();

const form = reactive({
  brandId: '',
  category: '未分类',
  categoryId: '',
  chipset: '',
  companyId: '',
  description: '',
  model: '',
  name: '',
  osName: '',
  osVersion: '',
  poeStandard: '',
  poeSupported: undefined as boolean | undefined,
  productType: '',
  quoteRemarks: '',
  quoteStatus: 'draft' as 'active' | 'draft',
  ramGb: undefined as number | undefined,
  resolutionHeight: undefined as number | undefined,
  resolutionWidth: undefined as number | undefined,
  seriesCode: '',
  seriesName: '',
  sizeInch: undefined as number | undefined,
  status: 'inactive' as 'active' | 'inactive',
  storageGb: undefined as number | undefined,
  summaryConfigText: '',
  validFrom: '',
});

const quoteTiers = ref<SaveQuoteTierInput[]>([
  { currency: 'USD', minQuantity: 10, unitPrice: 0 },
  { currency: 'USD', minQuantity: 100, unitPrice: 0 },
]);

function validateForm() {
  if (!form.model.trim()) throw new Error('请填写型号');
  if (!form.name.trim()) throw new Error('请填写产品名称');
  if (!form.seriesName.trim()) throw new Error('请填写系列名称');
  if (!form.category && !form.categoryId) throw new Error('请填写或选择分类');
}

function addTier() {
  quoteTiers.value.push({ currency: 'USD', minQuantity: 500, unitPrice: 0 });
}

function removeTier(index: number) {
  quoteTiers.value.splice(index, 1);
}

function resetForm() {
  createdProduct.value = undefined;
  form.brandId = '';
  form.category = '未分类';
  form.categoryId = '';
  form.chipset = '';
  form.companyId = '';
  form.description = '';
  form.model = '';
  form.name = '';
  form.osName = '';
  form.osVersion = '';
  form.poeStandard = '';
  form.poeSupported = undefined;
  form.productType = '';
  form.quoteRemarks = '';
  form.quoteStatus = 'draft';
  form.ramGb = undefined;
  form.resolutionHeight = undefined;
  form.resolutionWidth = undefined;
  form.seriesCode = '';
  form.seriesName = '';
  form.sizeInch = undefined;
  form.status = 'inactive';
  form.storageGb = undefined;
  form.summaryConfigText = '';
  form.validFrom = '';
  quoteTiers.value = [
    { currency: 'USD', minQuantity: 10, unitPrice: 0 },
    { currency: 'USD', minQuantity: 100, unitPrice: 0 },
  ];
}

async function loadOptions() {
  const [categoryRecords, brandRecords, companyRecords] = await Promise.all([
    listCategories(),
    listBrands(),
    listCompanies(),
  ]);
  categories.value = categoryRecords;
  brands.value = brandRecords;
  companies.value = companyRecords;
}

async function submitProduct(saveAsDraft = true) {
  try {
    validateForm();
    saving.value = true;
    const product = await createProduct({
      brandId: form.brandId || undefined,
      category: form.category,
      categoryId: form.categoryId || undefined,
      chipset: form.chipset || undefined,
      companyId: form.companyId || undefined,
      description: form.description || undefined,
      model: form.model.trim(),
      name: form.name.trim(),
      osName: form.osName || undefined,
      osVersion: form.osVersion || undefined,
      poeStandard: form.poeStandard || undefined,
      poeSupported: form.poeSupported,
      productType: form.productType || undefined,
      ramGb: form.ramGb,
      resolutionHeight: form.resolutionHeight,
      resolutionWidth: form.resolutionWidth,
      seriesCode: form.seriesCode || form.model,
      seriesName: form.seriesName,
      sizeInch: form.sizeInch,
      specJson: {
        chipset: form.chipset,
        os: [form.osName, form.osVersion].filter(Boolean).join(' '),
        poe: form.poeStandard,
        ram: form.ramGb ? `${form.ramGb}GB` : undefined,
        resolution:
          form.resolutionWidth && form.resolutionHeight
            ? `${form.resolutionWidth} x ${form.resolutionHeight}`
            : undefined,
        storage: form.storageGb ? `${form.storageGb}GB` : undefined,
      },
      status: saveAsDraft ? 'inactive' : form.status,
      storageGb: form.storageGb,
      summaryConfigText: form.summaryConfigText || undefined,
      tags: ['手动建档'],
    });
    createdProduct.value = product;

    const tiers = quoteTiers.value.filter((tier) => tier.minQuantity > 0 && tier.unitPrice > 0);
    if (tiers.length && form.companyId) {
      await createQuote({
        batchTitle: `${form.model} 手动报价`,
        companyId: form.companyId,
        currency: tiers[0]?.currency || 'USD',
        productId: product.id,
        remarks: form.quoteRemarks || undefined,
        standardConfigText: form.summaryConfigText || undefined,
        status: form.quoteStatus,
        tiers,
        validFrom: form.validFrom || undefined,
      });
    }

    ElMessage.success('单品建档已完成');
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    saving.value = false;
  }
}

onMounted(loadOptions);
</script>

<template>
  <div>
    <ElAlert class="mb-4" :closable="false" show-icon title="快速建档会一次性创建商品与报价阶梯，适合没有 Excel、但需要尽快补录型号和价格的场景。" type="info" />

    <div class="grid gap-4 xl:grid-cols-[1fr_420px]">
      <ElCard shadow="never">
        <template #header>商品基础信息</template>
        <ElForm label-width="96px">
          <ElFormItem label="型号"><ElInput v-model="form.model" /></ElFormItem>
          <ElFormItem label="产品名称"><ElInput v-model="form.name" /></ElFormItem>
          <ElFormItem label="系列编码"><ElInput v-model="form.seriesCode" placeholder="默认使用型号" /></ElFormItem>
          <ElFormItem label="系列名称"><ElInput v-model="form.seriesName" /></ElFormItem>
          <ElFormItem label="分类">
            <ElSelect v-model="form.categoryId" clearable filterable style="width: 100%">
              <ElOption v-for="category in categories" :key="category.id" :label="category.name" :value="category.id" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="备用分类"><ElInput v-model="form.category" /></ElFormItem>
          <ElFormItem label="品牌">
            <ElSelect v-model="form.brandId" clearable filterable style="width: 100%">
              <ElOption v-for="brand in brands" :key="brand.id" :label="brand.name" :value="brand.id" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="公司">
            <ElSelect v-model="form.companyId" clearable filterable style="width: 100%">
              <ElOption v-for="company in companies" :key="company.id" :label="company.name" :value="company.id" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="产品类型"><ElInput v-model="form.productType" /></ElFormItem>
          <ElFormItem label="描述"><ElInput v-model="form.description" :rows="3" type="textarea" /></ElFormItem>
        </ElForm>
      </ElCard>

      <ElCard shadow="never">
        <template #header>关键规格</template>
        <ElForm label-width="88px">
          <ElFormItem label="尺寸"><ElInputNumber v-model="form.sizeInch" :min="0" style="width: 100%" /></ElFormItem>
          <ElFormItem label="芯片"><ElInput v-model="form.chipset" /></ElFormItem>
          <ElFormItem label="RAM"><ElInputNumber v-model="form.ramGb" :min="0" style="width: 100%" /></ElFormItem>
          <ElFormItem label="存储"><ElInputNumber v-model="form.storageGb" :min="0" style="width: 100%" /></ElFormItem>
          <ElFormItem label="系统"><ElInput v-model="form.osName" /></ElFormItem>
          <ElFormItem label="系统版本"><ElInput v-model="form.osVersion" /></ElFormItem>
          <ElFormItem label="分辨率宽"><ElInputNumber v-model="form.resolutionWidth" :min="0" style="width: 100%" /></ElFormItem>
          <ElFormItem label="分辨率高"><ElInputNumber v-model="form.resolutionHeight" :min="0" style="width: 100%" /></ElFormItem>
          <ElFormItem label="POE"><ElInput v-model="form.poeStandard" /></ElFormItem>
          <ElFormItem label="配置摘要"><ElInput v-model="form.summaryConfigText" :rows="3" type="textarea" /></ElFormItem>
        </ElForm>
      </ElCard>
    </div>

    <ElCard class="mt-4" shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span>报价阶梯</span>
          <ElButton type="primary" @click="addTier">新增阶梯</ElButton>
        </div>
      </template>
      <ElTable :data="quoteTiers" stripe>
        <ElTableColumn label="数量门槛" width="160"><template #default="{ row }"><ElInputNumber v-model="row.minQuantity" :min="1" /></template></ElTableColumn>
        <ElTableColumn label="币种" width="140"><template #default="{ row }"><ElSelect v-model="row.currency"><ElOption label="USD" value="USD" /><ElOption label="CNY" value="CNY" /><ElOption label="EUR" value="EUR" /></ElSelect></template></ElTableColumn>
        <ElTableColumn label="单价" width="180"><template #default="{ row }"><ElInputNumber v-model="row.unitPrice" :min="0" :precision="4" /></template></ElTableColumn>
        <ElTableColumn label="操作" width="100"><template #default="{ $index }"><ElButton link type="danger" @click="removeTier($index)">删除</ElButton></template></ElTableColumn>
      </ElTable>
      <ElForm class="mt-4" label-width="96px">
        <ElFormItem label="报价状态"><ElSelect v-model="form.quoteStatus" style="width: 180px"><ElOption label="草稿" value="draft" /><ElOption label="启用" value="active" /></ElSelect></ElFormItem>
        <ElFormItem label="生效日期"><ElDatePicker v-model="form.validFrom" type="date" value-format="YYYY-MM-DD" /></ElFormItem>
        <ElFormItem label="报价备注"><ElInput v-model="form.quoteRemarks" :rows="3" type="textarea" /></ElFormItem>
      </ElForm>
    </ElCard>

    <ElCard class="mt-4" shadow="never">
      <ElSpace wrap>
        <ElButton :disabled="!isAdmin" :loading="saving" @click="submitProduct(true)">保存为草稿</ElButton>
        <ElButton :disabled="!isAdmin" :loading="saving" type="primary" @click="submitProduct(false)">直接入库</ElButton>
        <ElButton :disabled="saving" @click="resetForm">清空表单</ElButton>
        <ElTag v-if="createdProduct" type="success">已创建：{{ createdProduct.model }} / {{ createdProduct.name }}</ElTag>
      </ElSpace>
    </ElCard>
  </div>
</template>
