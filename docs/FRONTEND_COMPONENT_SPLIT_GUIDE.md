# Vue Views 组件拆分规范

本文用于约束 `apps/web-front`、`apps/web-ele` 等 Vue 应用在 `views` 页面开发和重构时的组件封装方式，尤其用于约束 AI coding agent，避免出现两类问题：

1. 所有代码都堆在 `views/[module]/index.vue`，导致页面文件过大、职责混乱、后续不可维护。
2. 为了拆分而拆分，把简单标题、搜索框、tabs 等轻量结构拆成大量小组件，导致 `index.vue` 变成没有业务可读性的组件清单。

本规范采用“适度组件化”原则：**不是把页面拆得越细越好，而是把独立性高、复杂度高、变化边界清晰的 UI 或功能块拆到当前模块的 `components/`。**

## 参考思想

Vue 官方组件文档强调，组件用于把 UI 拆成独立、可复用的部分，并允许每个组件封装自己的内容和逻辑。

Vue SFC 文档也说明，关注点分离不等于按 HTML、CSS、JS 文件类型强行拆开。现代 UI 更适合拆成低耦合组件进行组合；在一个组件内部，模板、逻辑和样式本身是强相关的，放在一起可以提高组件的内聚性和可维护性。

因此，本项目采用以下口径：

- `index.vue` 可以保留页面级结构和轻量交互。
- 独立业务块可以封装成组件。
- 组件可以包含自己的 template、script、style。
- 如果接口、状态、逻辑只服务当前组件，可以放在组件内部。
- 不为了追求“薄页面”而过度封装。

## 目录约定

当前模块私有组件必须放在当前模块的 `components/` 下：

```text
src/views/[module]/
├── index.vue
└── components/
    ├── XxxItem.vue
    ├── XxxDetailDialog.vue
    ├── XxxFormDrawer.vue
    └── XxxUploadPanel.vue
```

除非组件已经被多个业务模块真实复用，否则不要放到 `src/components/`。

### 正确示例

```text
apps/web-front/src/views/qa-center/
├── index.vue
└── components/
    ├── QaQuestionItem.vue
    ├── QaAnswerItem.vue
    ├── QaQuestionDetailDialog.vue
    └── QaQuestionFormDialog.vue
```

### 不推荐示例

```text
apps/web-front/src/views/qa-center/
├── index.vue
└── components/
    ├── QaHero.vue
    ├── QaSearchBar.vue
    ├── QaCategoryTabs.vue
    ├── QaQuestionList.vue
    ├── QaQuestionItem.vue
    ├── QaEmptyState.vue
    ├── QaLoadingState.vue
    └── QaDetailPanel.vue
```

上面的拆法过细。简单 hero、search、tabs、empty state 如果没有复杂逻辑或复用诉求，优先保留在 `index.vue`。

## 核心原则

### 1. 不为拆分而拆分

组件拆分的目标是提升可维护性，而不是让文件数量变多。

如果一个结构只有几行、逻辑简单、只在当前页面出现一次，拆出去通常不会提升可维护性，反而会增加 props、emit 和文件跳转成本。

### 2. `index.vue` 应保留页面可读性

`index.vue` 不是只能做组件拼装。它应保留页面的主结构，让开发者打开页面文件后能快速理解页面由哪些区域组成。

`index.vue` 可以保留：

- 页面标题区、说明文案、轻量 hero。
- 简单搜索框。
- 简单 tabs / 分类按钮。
- 简单筛选条件。
- 页面级布局结构。
- 页面级 ref、computed、watch。
- 页面级数据加载。
- 页面级事件协调。

### 3. 优先拆独立业务块

应优先拆分具有明确业务语义、独立变化边界或较复杂内部结构的组件。

典型包括：

- `v-for` 中结构复杂的列表 item。
- 详情弹窗、编辑弹窗、表单弹窗。
- 抽屉、侧边详情面板。
- 表格和表格行操作。
- 上传区、导入区、预览区。
- 复杂业务卡片。
- 独立业务面板。

### 4. 组件可以带自己的逻辑

组件不是只能做纯展示。只要逻辑、状态、接口只服务当前组件，就可以放在组件内部。

允许的例子：

- 详情弹窗根据 `id` 自己请求详情。
- 编辑弹窗自己维护表单状态并提交保存。
- 上传组件自己处理文件选择、进度、失败重试。
- 表格组件自己处理分页、排序、刷新。
- 独立业务面板自己加载只服务自己的统计数据。

### 5. 避免列表 item 内部产生 N+1 请求

列表 item 通常不应自己请求详情接口。列表页应统一获取列表数据，item 通过 props 接收数据。

详情接口可以放到详情弹窗中按需请求，因为弹窗只在用户打开时加载，不会随列表渲染产生大量请求。

## 拆分判断标准

满足以下任意条件，优先考虑拆组件：

- 该块是 `v-for` 中的复杂 item。
- 该块是弹窗、抽屉、表单、表格、上传等独立功能区。
- 该块 template 超过约 40 行，且有明确业务语义。
- 该块有独立 loading、error、submit、save、delete、upload 等状态。
- 该块后续可能独立变化，不希望影响整个页面。
- 该块已经或很可能在同一模块多个页面中复用。

满足以下情况，默认不拆：

- 简单页面标题、说明文案、hero。
- 简单搜索框。
- 简单 tabs。
- 简单筛选按钮。
- 两三行空状态。
- 纯布局容器。
- 拆出去后需要传入大量 props，反而降低可读性。

## 常见模块处理方式

| 页面区域 | 默认处理方式 | 说明 |
| --- | --- | --- |
| 页面标题 / hero | 留在 `index.vue` | 除非结构复杂或复用 |
| 简单搜索框 | 留在 `index.vue` | 输入框 + 按钮无需强拆 |
| 简单 tabs | 留在 `index.vue` | 页面级筛选可直接写在页面里 |
| 复杂筛选表单 | 拆组件 | 字段多、交互多、折叠/重置/联动时拆 |
| 列表 item | 拆组件 | 尤其是结构复杂、样式多的 item |
| 回答 item / 评论 item | 拆组件 | 独立业务对象 |
| 详情弹窗 | 拆组件 | 可以自己请求详情接口 |
| 新增/编辑弹窗 | 拆组件 | 可以自己处理表单提交 |
| 表格 | 拆组件 | 列配置、分页、操作通常较复杂 |
| 上传区 | 拆组件 | 上传状态、进度、错误处理独立 |
| 简单空状态 | 留在 `index.vue` | 复杂插画/重试逻辑时再拆 |

## 展示组件与功能组件

### 展示组件

展示组件主要通过 props 接收数据，通过 emit 通知父级用户行为。

适合：

- `QaQuestionItem.vue`
- `QaAnswerItem.vue`
- `ProductVariantCard.vue`
- `QuotePriceTierItem.vue`

要求：

- 使用 `defineProps` 明确声明入参。
- 使用 `defineEmits` 明确声明事件。
- 不直接请求接口。
- 可以有少量局部状态，例如展开/收起、hover、内部 tab。

示例：

```vue
<script setup lang="ts">
defineProps<{
  question: {
    id: string;
    title: string;
    summary: string;
    answerCount: number;
  };
}>();

const emit = defineEmits<{
  select: [id: string];
}>();
</script>

<template>
  <article class="qa-question-item" @click="emit('select', question.id)">
    <h3>{{ question.title }}</h3>
    <p>{{ question.summary }}</p>
    <span>{{ question.answerCount }} 个回答</span>
  </article>
</template>
```

### 功能组件

功能组件可以形成自己的局部业务闭环。

适合：

- `QaQuestionDetailDialog.vue`
- `QaQuestionFormDialog.vue`
- `ProductEditDrawer.vue`
- `DocumentUploadPanel.vue`
- `QuoteBatchTable.vue`

允许：

- 自己维护 `loading`、`errorMessage`、`formModel`。
- 自己调用只服务当前组件的接口。
- 自己处理提交、重试、关闭前校验。
- 通过 emit 通知父级刷新列表或关闭弹窗。

示例：

```vue
<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  questionId: string;
  show: boolean;
}>();

const emit = defineEmits<{
  'update:show': [value: boolean];
  saved: [];
}>();

const loading = ref(false);
const errorMessage = ref('');

async function loadDetail() {
  if (!props.questionId) {
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    // 只服务当前弹窗的详情接口可以放在组件内部调用
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '加载失败';
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.show, props.questionId],
  ([show]) => {
    if (show) {
      void loadDetail();
    }
  },
);
</script>
```

## 命名规范

### 组件名必须多词

禁止使用：

```text
Item.vue
Dialog.vue
Form.vue
Table.vue
```

推荐使用：

```text
QaQuestionItem.vue
QaQuestionDetailDialog.vue
ProductVariantCard.vue
QuoteBatchTable.vue
DocumentUploadPanel.vue
```

### 模块私有组件使用模块前缀

当前模块私有组件应体现业务上下文，避免编辑器中出现大量无法区分的 `Item.vue`、`Dialog.vue`、`Form.vue`。

例如 `qa-center` 模块：

```text
QaQuestionItem.vue
QaAnswerItem.vue
QaQuestionDetailDialog.vue
QaQuestionFormDialog.vue
```

例如 `quote` 模块：

```text
QuoteBatchTable.vue
QuoteBatchFormDrawer.vue
QuotePriceTierItem.vue
```

## Props 与 Emits 规范

### Props

- 必须使用 `defineProps` 明确声明。
- TypeScript 项目优先使用类型声明。
- 不传无意义的大对象，除非该对象就是组件的核心业务模型。
- 不让子组件直接修改父组件传入的对象。

### Emits

- 必须使用 `defineEmits` 明确声明事件。
- 事件表达业务意图，不表达 DOM 细节。

推荐：

```ts
const emit = defineEmits<{
  select: [id: string];
  saved: [];
  closed: [];
}>();
```

不推荐：

```ts
const emit = defineEmits(['click', 'change', 'ok']);
```

除非组件本身就是基础 UI，否则事件名应尽量表达业务含义。

## `v-for` 规范

- 所有 `v-for` 必须有稳定唯一的 `:key`。
- 复杂 item 应拆为独立组件。
- 不要在同一个元素上同时使用 `v-for` 和 `v-if`。
- 列表过滤应优先使用 computed，在模板中渲染过滤后的数组。

推荐：

```vue
<QaQuestionItem
  v-for="question in filteredQuestions"
  :key="question.id"
  :question="question"
  @select="openQuestionDetail"
/>
```

不推荐：

```vue
<QaQuestionItem
  v-for="question in questions"
  v-if="question.visible"
  :key="question.id"
  :question="question"
/>
```

## `index.vue` 示例

适度拆分后的页面应该类似：

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';

import QaQuestionDetailDialog from './components/QaQuestionDetailDialog.vue';
import QaQuestionItem from './components/QaQuestionItem.vue';

const keyword = ref('');
const activeTab = ref('all');
const selectedQuestionId = ref('');
const detailVisible = ref(false);

const tabs = [
  { label: '全部', value: 'all' },
  { label: '常见问题', value: 'common' },
  { label: '产品问题', value: 'product' },
  { label: '报价问题', value: 'quote' },
];

const filteredQuestions = computed(() => {
  // 页面级筛选逻辑可以保留在 index.vue
  return [];
});

function openQuestionDetail(questionId: string) {
  selectedQuestionId.value = questionId;
  detailVisible.value = true;
}
</script>

<template>
  <section class="qa-center">
    <header class="qa-center__header">
      <h1>问答中心</h1>
      <p>查看产品、报价、资料相关问题</p>
    </header>

    <div class="qa-center__search">
      <input v-model="keyword" placeholder="搜索问题关键词" />
    </div>

    <div class="qa-center__tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="{ 'is-active': activeTab === tab.value }"
        type="button"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <section class="qa-center__list">
      <QaQuestionItem
        v-for="question in filteredQuestions"
        :key="question.id"
        :question="question"
        @select="openQuestionDetail"
      />
    </section>

    <QaQuestionDetailDialog
      v-model:show="detailVisible"
      :question-id="selectedQuestionId"
    />
  </section>
</template>
```

该示例中：

- 标题、搜索、tabs 保留在 `index.vue`。
- 列表 item 拆到组件。
- 详情弹窗拆到组件。
- `index.vue` 仍能看出页面完整结构。
- 没有为了拆分而拆分。

## AI 开发硬性要求

后续 AI coding agent 在开发或重构 Vue 页面时，必须遵守以下步骤：

1. 先判断页面中哪些块应该留在 `index.vue`，哪些块应该拆到 `components/`。
2. 不允许默认把 hero、search、tabs、empty state 全部拆出。
3. 优先拆复杂 item、dialog、drawer、form、table、upload、detail panel。
4. 组件必须放在当前模块的 `components/`，不要擅自放入全局 `src/components/`。
5. 组件可以包含只服务自己的逻辑和接口。
6. 列表 item 不得因自身渲染触发详情接口请求，避免 N+1 请求。
7. 拆分后必须说明：
   - 拆了哪些组件。
   - 每个组件为什么值得拆。
   - 哪些内容故意保留在 `index.vue`。
   - 是否存在接口或状态下沉到组件内部。
8. 除非用户明确要求，不要顺手抽 `composables/`、`types.ts`、`constants.ts`、`utils.ts`。
9. 保持功能、视觉、接口语义和路由不变。
10. 修改完成后至少运行对应应用的 typecheck。

## 适用于 `qa-center` 的推荐口径

对于 `apps/web-front/src/views/qa-center/index.vue`，默认推荐只拆：

```text
components/
├── QaQuestionItem.vue
├── QaAnswerItem.vue
├── QaQuestionDetailDialog.vue
└── QaQuestionFormDialog.vue
```

默认保留在 `index.vue`：

- 页面标题区。
- 搜索输入框。
- 简单分类 tabs。
- 页面级筛选状态。
- 页面级列表数据加载。
- 打开/关闭弹窗的协调状态。

只有当搜索区、tabs、空状态本身变得复杂，或被多个页面复用时，才考虑进一步拆分。

## 参考链接

- Vue Components Basics: https://vuejs.org/guide/essentials/component-basics.html
- Vue Single-File Components: https://vuejs.org/guide/scaling-up/sfc.html
- Vue Style Guide - Essential Rules: https://vuejs.org/style-guide/rules-essential.html
- Vue Style Guide - Strongly Recommended Rules: https://vuejs.org/style-guide/rules-strongly-recommended.html
