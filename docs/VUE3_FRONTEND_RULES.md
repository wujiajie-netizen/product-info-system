# Vue3 项目开发强制规范（AI 指令集）

> 以下路径以前端项目根目录为准，如 `apps/web-front/`、`apps/web-ele/`。

## 1. 目录分层

核心原则：**私有优先，公共上浮；按需封装，禁止过度设计。**

```text
src/
├── views/                         # 页面模块，目录名使用 kebab-case
│   └── [module]/                  # 业务模块目录
│       ├── index.vue              # 模块主页面
│       ├── detail.vue             # 模块详情页或子页面
│       ├── components/            # 模块私有组件
│       ├── hooks/                 # 模块私有组合式函数，可选
│       ├── utils/                 # 模块私有工具函数，可选
│       ├── types.ts               # 模块私有类型，可选
│       └── [child]/               # 子页面目录，可选
├── components/                    # 跨模块公共组件
├── hooks/                         # 跨模块公共组合式函数
├── stores/                        # Pinia 共享状态
├── router/                        # 路由配置
├── api/                           # 接口请求
├── utils/                         # 跨模块公共工具函数
├── types/                         # 跨模块公共类型
└── assets/                        # 静态资源
```

放置规则：

- 只给当前模块使用的组件、hook、utils、types，放在 `views/[module]/` 内。
- 被多个模块复用的组件，才放到 `src/components/`。
- 被多个模块复用的组合式函数，才放到 `src/hooks/`。
- 被多个模块复用的工具函数，才放到 `src/utils/`。
- 被多个模块复用的类型，才放到 `src/types/`。
- 不得为了减少文件数量破坏分层，也不得为了分层制造无意义文件。

## 2. 组件规则

组件不是越多越好，必须有明确职责边界。

应该封装：

- 同一结构或逻辑重复出现 2 次及以上。
- 有独立展示职责或独立交互逻辑。
- 可通过 `props + emits` 独立驱动。
- 页面过大，且抽离后父子职责仍然清晰。

不应该封装：

- 只有几行模板或简单胶水代码。
- 强依赖当前页面上下文。
- 抽离后需要传大量零散 props。
- 抽离后父子边界更模糊。
- 没有复用价值，也没有独立维护价值。

组件放置：

- 当前模块私有组件：`src/views/[module]/components/`。
- 跨模块公共基础组件：`src/components/base/`。
- 跨模块公共业务组件：`src/components/business/`。
- `src/components/` 禁止放只服务单个模块的组件。

## 3. 页面职责

`views/[module]/index.vue` 只做页面编排。

允许：

- 页面布局。
- 组件组装。
- 数据分发。
- 事件转发。
- 少量简单状态。

禁止：

- 堆积大段业务判断。
- 堆积复杂请求流程。
- 堆积复杂表单流程。
- 堆积可独立维护的大段模板。

页面变复杂时，优先顺序：

1. 拆到 `views/[module]/components/`。
2. 模块私有逻辑拆到 `views/[module]/hooks/`。
3. 确认跨模块复用后，再上浮到 `src/components/` 或 `src/hooks/`。

## 4. Hooks 规则

- hook 命名必须以 `use` 开头。
- 当前模块私有 hook 放在 `views/[module]/hooks/`。
- 跨模块公共 hook 才放在 `src/hooks/`。
- 不要为了让页面变短而强行抽 hook。
- 抽 hook 后如果暴露状态过多、调用更复杂，说明不该抽。

## 5. 请求与状态规则

- 所有接口请求统一放入 `src/api/`。
- 组件内禁止直接写 `axios.get/post`。
- API 文件只负责请求和数据适配，不处理展示逻辑。
- 简单页面请求可直接在页面或模块私有 hook 中调用 api。
- 复杂且仅当前模块使用的请求流程，放在 `views/[module]/hooks/`。
- 跨模块复用的请求流程，才放到 `src/hooks/`。
- `stores/` 只存跨组件、跨页面或跨模块共享状态。
- 单页面临时状态、弹窗状态、表单状态不得放入 store。

## 6. 编码规范

- 目录名使用 `kebab-case`。
- 组件文件使用 `PascalCase.vue`。
- 组件标签使用 `PascalCase`。
- `props` 必须声明类型。
- 事件必须使用 `defineEmits`。
- 样式必须使用 `<style scoped>` 或 CSS Modules。
- 禁止污染全局样式。
- 公共组件禁止直接依赖具体模块 API、路由、store。

## 7. AI 输出要求

生成或重构代码时必须遵守：

- 默认先放模块私有目录，不默认上浮公共目录。
- 只有确认跨模块复用，才放 `src/components/`、`src/hooks/`、`src/utils/`、`src/types/`。
- 不得为了封装而封装。
- 不得为了减少页面行数破坏职责边界。
- 新组件必须明确 `props`、`emits`、职责边界。
- 重构必须保持原有功能、逻辑、接口行为不变。
