<script lang="ts" setup>
import type {
  BrandRecord,
  CategoryRecord,
  CompanyRecord,
  ProductRecord,
  ProductStatus,
} from '#/api';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  ElButton,
  ElCard,
  ElDialog,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElPopconfirm,
  ElSelect,
  ElSpace,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  createProduct,
  listBrands,
  listCategories,
  listCompanies,
  listProducts,
  setProductStatus,
  updateProduct,
} from '#/api';

const userStore = useUserStore();
const loading = ref(false);
const saving = ref(false);
const keyword = ref('');
const products = ref<ProductRecord[]>([]);
const categories = ref<CategoryRecord[]>([]);
const brands = ref<BrandRecord[]>([]);
const companies = ref<CompanyRecord[]>([]);
const dialogVisible = ref(false);
const editingProduct = ref<ProductRecord>();

const isAdmin = computed(() => userStore.userRoles.includes('admin'));
const dialogTitle = computed(() =>
  editingProduct.value ? '编辑产品' : '新增产品',
);

const form = reactive({
  category: '',
  categoryId: '',
  brandId: '',
  description: '',
  model: '',
  name: '',
  chipset: '',
  companyId: '',
  osName: '',
  osVersion: '',
  poeStandard: '',
  poeSupported: false,
  productType: '',
  ramGb: undefined as number | undefined,
  resolutionHeight: undefined as number | undefined,
  resolutionWidth: undefined as number | undefined,
  seriesCode: '',
  seriesId: '',
  seriesName: '',
  sizeInch: undefined as number | undefined,
  specJsonText: '{}',
  status: 'active' as ProductStatus,
  storageGb: undefined as number | undefined,
  summaryConfigText: '',
  tagsText: '',
});

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

async function loadProducts() {
  try {
    loading.value = true;
    products.value = await listProducts({ keyword: keyword.value });
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  editingProduct.value = undefined;
  form.category = '';
  form.categoryId = '';
  form.brandId = '';
  form.description = '';
  form.model = '';
  form.name = '';
  form.chipset = '';
  form.companyId = '';
  form.osName = '';
  form.osVersion = '';
  form.poeStandard = '';
  form.poeSupported = false;
  form.productType = '';
  form.ramGb = undefined;
  form.resolutionHeight = undefined;
  form.resolutionWidth = undefined;
  form.seriesCode = '';
  form.seriesId = '';
  form.seriesName = '';
  form.sizeInch = undefined;
  form.specJsonText = '{}';
  form.status = 'active';
  form.storageGb = undefined;
  form.summaryConfigText = '';
  form.tagsText = '';
}

function openCreateDialog() {
  resetForm();
  dialogVisible.value = true;
}

function openEditDialog(row: ProductRecord) {
  editingProduct.value = row;
  form.category = row.category;
  form.categoryId = row.category_id || '';
  form.brandId = row.brand_id || '';
  form.chipset = row.chipset || '';
  form.companyId = row.company_id || '';
  form.description = row.description || '';
  form.model = row.model;
  form.name = row.name;
  form.osName = row.os_name || '';
  form.osVersion = row.os_version || '';
  form.poeStandard = row.poe_standard || '';
  form.poeSupported = row.poe_supported || false;
  form.productType = row.product_type || '';
  form.ramGb = row.ram_gb || undefined;
  form.resolutionHeight = row.resolution_height || undefined;
  form.resolutionWidth = row.resolution_width || undefined;
  form.seriesCode = row.series_code || row.model;
  form.seriesId = row.series_id || '';
  form.seriesName = row.series_name || row.name;
  form.sizeInch = row.size_inch || undefined;
  form.specJsonText = JSON.stringify(row.spec_json || {}, null, 2);
  form.status = row.status === 'inactive' ? 'inactive' : 'active';
  form.storageGb = row.storage_gb || undefined;
  form.summaryConfigText = row.summary_config_text || '';
  form.tagsText = row.tags.join(', ');
  dialogVisible.value = true;
}

function parseSpecJson() {
  try {
    const value = JSON.parse(form.specJsonText || '{}');

    if (!value || Array.isArray(value) || typeof value !== 'object') {
      throw new Error('规格参数必须是 JSON 对象');
    }

    return value as Record<string, unknown>;
  } catch (error) {
    throw new Error((error as Error).message || '规格参数 JSON 格式不正确', {
      cause: error,
    });
  }
}

function buildProductInput() {
  const model = form.model.trim();
  const name = form.name.trim();
  const selectedCategory = categories.value.find(
    (item) => item.id === form.categoryId,
  );
  const category = (selectedCategory?.name || form.category).trim();

  if (!model || !name || !category) {
    throw new Error('请填写产品型号、名称和分类');
  }

  return {
    brandId: form.brandId || undefined,
    category,
    categoryId: form.categoryId || undefined,
    chipset: form.chipset.trim() || undefined,
    companyId: form.companyId || undefined,
    description: form.description.trim() || undefined,
    model,
    name,
    osName: form.osName.trim() || undefined,
    osVersion: form.osVersion.trim() || undefined,
    poeStandard: form.poeStandard.trim() || undefined,
    poeSupported: form.poeSupported,
    productType: form.productType.trim() || undefined,
    ramGb: form.ramGb,
    resolutionHeight: form.resolutionHeight,
    resolutionWidth: form.resolutionWidth,
    seriesCode: form.seriesCode.trim() || undefined,
    seriesId: form.seriesId || undefined,
    seriesName: form.seriesName.trim() || undefined,
    sizeInch: form.sizeInch,
    specJson: parseSpecJson(),
    status: form.status,
    storageGb: form.storageGb,
    summaryConfigText: form.summaryConfigText.trim() || undefined,
    tags: form.tagsText
      .split(/[,，]/)
      .map((tag) => tag.trim())
      .filter(Boolean),
  };
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

async function submitProduct() {
  try {
    saving.value = true;
    const input = buildProductInput();

    if (editingProduct.value) {
      await updateProduct(editingProduct.value.id, input);
      ElMessage.success('产品已更新');
    } else {
      await createProduct(input);
      ElMessage.success('产品已新增');
    }

    dialogVisible.value = false;
    await loadProducts();
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    saving.value = false;
  }
}

async function handleStatusChange(row: ProductRecord) {
  const nextStatus: ProductStatus =
    row.status === 'active' ? 'inactive' : 'active';

  try {
    await setProductStatus(row.id, nextStatus);
    ElMessage.success(nextStatus === 'active' ? '产品已启用' : '产品已停用');
    await loadProducts();
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

onMounted(async () => {
  await Promise.all([loadOptions(), loadProducts()]);
});
</script>

<template>
  <Page description="维护系列、变体和真实产品关键字段" title="产品管理">
    <ElCard shadow="never">
      <ElSpace class="mb-4" wrap>
        <ElInput
          v-model="keyword"
          clearable
          placeholder="搜索系列、型号、名称、芯片"
          style="width: 320px"
          @clear="loadProducts"
          @keyup.enter="loadProducts"
        />
        <ElButton @click="loadProducts">查询</ElButton>
        <ElButton v-if="isAdmin" type="primary" @click="openCreateDialog">
          新增产品
        </ElButton>
      </ElSpace>
      <ElTable v-loading="loading" :data="products" stripe>
        <ElTableColumn label="系列" min-width="180">
          <template #default="{ row }">
            <div>{{ row.series_name || row.name }}</div>
            <small>{{ row.series_code || '-' }}</small>
          </template>
        </ElTableColumn>
        <ElTableColumn label="产品型号" prop="model" width="160" />
        <ElTableColumn label="产品名称" min-width="220" prop="name" />
        <ElTableColumn label="分类" prop="category" width="140" />
        <ElTableColumn label="公司" width="180">
          <template #default="{ row }">
            {{
              companies.find((company) => company.id === row.company_id)?.name ||
              '-'
            }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="品牌" width="140">
          <template #default="{ row }">
            {{ brands.find((brand) => brand.id === row.brand_id)?.name || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="关键规格" min-width="220">
          <template #default="{ row }">
            <div>
              {{ row.size_inch ? `${row.size_inch}"` : '-' }} /
              {{ row.chipset || '-' }} /
              {{ row.ram_gb ? `${row.ram_gb}GB` : '-' }}
            </div>
            <small>
              {{ row.resolution_width && row.resolution_height
                ? `${row.resolution_width} x ${row.resolution_height}`
                : row.product_type || '未设置产品类型' }}
            </small>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" prop="status" width="100">
          <template #default="{ row }">
            <ElTag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '启用' : '停用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="标签" min-width="180">
          <template #default="{ row }">
            <ElSpace wrap>
              <ElTag v-for="tag in row.tags" :key="tag" type="info">
                {{ tag }}
              </ElTag>
            </ElSpace>
          </template>
        </ElTableColumn>
        <ElTableColumn label="更新时间" width="140">
          <template #default="{ row }">
            {{ formatDate(row.updated_at) }}
          </template>
        </ElTableColumn>
        <ElTableColumn v-if="isAdmin" fixed="right" label="操作" width="150">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openEditDialog(row)">
              编辑
            </ElButton>
            <ElPopconfirm
              :title="
                row.status === 'active'
                  ? '确认停用该产品？'
                  : '确认启用该产品？'
              "
              @confirm="handleStatusChange(row)"
            >
              <template #reference>
                <ElButton link type="primary">
                  {{ row.status === 'active' ? '停用' : '启用' }}
                </ElButton>
              </template>
            </ElPopconfirm>
          </template>
        </ElTableColumn>
        <template #empty>
          <ElEmpty description="暂无产品资料" />
        </template>
      </ElTable>
    </ElCard>

    <ElDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="560px"
      @closed="resetForm"
    >
      <ElForm label-width="96px">
        <ElFormItem label="产品型号">
          <ElInput v-model="form.model" placeholder="例如 SEN-1000" />
        </ElFormItem>
        <ElFormItem label="系列编码">
          <ElInput v-model="form.seriesCode" placeholder="例如 KDS-KITCHEN" />
        </ElFormItem>
        <ElFormItem label="系列名称">
          <ElInput v-model="form.seriesName" placeholder="请输入系列名称" />
        </ElFormItem>
        <ElFormItem label="产品名称">
          <ElInput v-model="form.name" placeholder="请输入产品名称" />
        </ElFormItem>
        <ElFormItem label="公司">
          <ElSelect
            v-model="form.companyId"
            clearable
            filterable
            placeholder="选择供应商或品牌方"
            style="width: 100%"
          >
            <ElOption
              v-for="company in companies"
              :key="company.id"
              :label="company.name"
              :value="company.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="分类">
          <ElSelect
            v-model="form.categoryId"
            clearable
            filterable
            placeholder="选择结构化分类"
            style="width: 100%"
          >
            <ElOption
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="备用分类">
          <ElInput
            v-model="form.category"
            placeholder="未选择结构化分类时填写，例如 传感器"
          />
        </ElFormItem>
        <ElFormItem label="品牌">
          <ElSelect
            v-model="form.brandId"
            clearable
            filterable
            placeholder="选择品牌"
            style="width: 100%"
          >
            <ElOption
              v-for="brand in brands"
              :key="brand.id"
              :label="brand.name"
              :value="brand.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="产品类型">
          <ElInput
            v-model="form.productType"
            placeholder="例如 Kitchen Digital Signage"
          />
        </ElFormItem>
        <ElFormItem label="屏幕尺寸">
          <ElInputNumber v-model="form.sizeInch" :min="0" style="width: 100%" />
        </ElFormItem>
        <ElFormItem label="芯片">
          <ElInput v-model="form.chipset" placeholder="例如 RK3568" />
        </ElFormItem>
        <ElFormItem label="内存 / 存储">
          <ElSpace fill style="width: 100%">
            <ElInputNumber v-model="form.ramGb" :min="0" style="width: 100%" />
            <ElInputNumber
              v-model="form.storageGb"
              :min="0"
              style="width: 100%"
            />
          </ElSpace>
        </ElFormItem>
        <ElFormItem label="系统版本">
          <ElSpace fill style="width: 100%">
            <ElInput v-model="form.osName" placeholder="例如 Android" />
            <ElInput v-model="form.osVersion" placeholder="例如 13" />
          </ElSpace>
        </ElFormItem>
        <ElFormItem label="分辨率">
          <ElSpace fill style="width: 100%">
            <ElInputNumber
              v-model="form.resolutionWidth"
              :min="0"
              style="width: 100%"
            />
            <ElInputNumber
              v-model="form.resolutionHeight"
              :min="0"
              style="width: 100%"
            />
          </ElSpace>
        </ElFormItem>
        <ElFormItem label="POE">
          <ElSpace fill style="width: 100%">
            <ElSelect v-model="form.poeSupported" style="width: 160px">
              <ElOption :value="true" label="支持" />
              <ElOption :value="false" label="不支持" />
            </ElSelect>
            <ElInput
              v-model="form.poeStandard"
              placeholder="例如 IEEE 802.3af"
            />
          </ElSpace>
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="form.status" style="width: 100%">
            <ElOption label="启用" value="active" />
            <ElOption label="停用" value="inactive" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="标签">
          <ElInput v-model="form.tagsText" placeholder="多个标签用逗号分隔" />
        </ElFormItem>
        <ElFormItem label="简介">
          <ElInput
            v-model="form.description"
            :rows="3"
            placeholder="用于前台产品详情和列表摘要"
            type="textarea"
          />
        </ElFormItem>
        <ElFormItem label="配置摘要">
          <ElInput
            v-model="form.summaryConfigText"
            :rows="2"
            placeholder="用于报价标准配置和详情摘要"
            type="textarea"
          />
        </ElFormItem>
        <ElFormItem label="规格参数">
          <ElInput
            v-model="form.specJsonText"
            :rows="6"
            placeholder='例如 {"range":"-20~80C"}'
            type="textarea"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton :loading="saving" type="primary" @click="submitProduct">
          保存
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
