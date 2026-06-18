# Vue3 项目开发强制规范（AI 指令集）

> 以下路径以前端项目根目录为准，如 `apps/web-ele/`。

## 1. 目录分层

必须按职责分层，禁止混放。

- `src/api/[moduleName].js`：接口请求
- `src/components/base/`：纯 UI 组件
- `src/components/business/`：业务组件
- `src/hooks/`：可复用逻辑
- `src/store/modules/[moduleName].js`：Pinia 状态模块
- `src/views/[moduleName]/[PageName].vue`：路由页面

## 2. 组件封装规则

必须封装：

- 重复出现 2 次及以上
- 有独立交互逻辑
- 可独立展示或测试
- 稳定的纯展示 UI

禁止封装：

- 仅当前页面使用的胶水代码
- 强依赖页面上下文的临时逻辑
- `views/*` 路由页面本身

判断标准：

- 能通过 `props + emits` 独立驱动，则封装
- 抽离后父子边界不清晰，则不封装

## 3. 分层职责

### `components/base/*`

只做 UI。

- 只接收 `props`
- 只通过 `emit` 通知外部
- 禁止 API 请求
- 禁止访问 `store`、`router`
- 禁止业务判断

### `components/business/*`

承载局部业务。

- 可调用 `hooks`、`store`
- 可包含组件自身交互逻辑
- 禁止直接写 `axios`
- 请求必须来自 `api` 或 `hooks`

### `views/*`

只做页面编排。

- 负责布局、组件组装、数据分发
- 简单请求可直接调用 `api`
- 复杂判断必须抽到 `hooks` 或 `store`
- 禁止堆积大段业务逻辑

### `hooks/*`

封装可复用逻辑。

- 命名必须以 `use` 开头
- 可封装请求、状态、计算、交互流程
- 复用 2 次及以上必须抽离为 hook

### `store/*`

管理共享状态。

- 只存跨组件、跨页面状态
- 复杂业务流程写入 `actions`
- 单组件临时状态不得放入 store

## 4. 请求规范

- 所有接口统一放入 `src/api/`
- 组件内禁止直接写 `axios.get/post`
- API 文件只负责请求，不处理展示逻辑
- 请求逻辑复用时必须抽到 `hooks`
- `loading`、`error`、`list` 等请求状态优先由 `hooks` 管理

## 5. 编码规范

- 组件文件使用 `PascalCase.vue`
- 组件标签使用 `PascalCase`
- `props` 必须声明 `type`、`required` 或 `default`
- 复杂对象 `props` 必须校验结构
- 事件必须使用 `defineEmits`
- 样式必须使用 `<style scoped>` 或 CSS Modules
- 禁止污染全局样式

## 6. AI 输出要求

生成代码时必须遵守：

- 新接口先写入 `api`
- 复用逻辑同步写入 `hooks`
- 共享状态写入 `store`
- 基础组件不得含业务逻辑
- 页面不得堆积复杂判断
- 新组件必须明确 `props`、`emits`、职责边界
- 不得为减少文件数量破坏分层
