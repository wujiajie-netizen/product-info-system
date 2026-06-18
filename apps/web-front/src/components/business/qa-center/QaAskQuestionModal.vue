<script setup lang="ts">
import { Send, X } from 'lucide-vue-next';

import type { QaCategoryOption, QaQuestionCategory } from '#/api/qa-center';
import AppIcon from '#/components/AppIcon.vue';
import type { QaAskQuestionForm } from '#/hooks/useQaCenter';

defineProps<{
  canSubmitQuestion: boolean;
  categories: QaCategoryOption[];
  descriptionCount: number;
  form: QaAskQuestionForm;
  submittedMessage: string;
  submitting: boolean;
}>();

const emit = defineEmits<{
  close: [];
  submit: [];
  'update-form-field': [field: keyof QaAskQuestionForm, value: QaQuestionCategory | string];
}>();

function updateTextField(field: keyof QaAskQuestionForm, event: Event) {
  emit('update-form-field', field, (event.target as HTMLInputElement | HTMLTextAreaElement).value);
}

function updateCategory(event: Event) {
  emit('update-form-field', 'category', (event.target as HTMLSelectElement).value as QaQuestionCategory);
}
</script>

<template>
  <div class="qa-modal-mask" @click.self="emit('close')">
    <section class="qa-modal" role="dialog" aria-modal="true" aria-label="提交商品问题">
      <header class="qa-modal__header">
        <h2>提交商品问题</h2>
        <button type="button" aria-label="关闭弹窗" @click="emit('close')">
          <AppIcon :icon="X" :size="18" />
        </button>
      </header>

      <div class="qa-modal__body">
        <label>
          商品型号 <span>*</span>
          <input
            :value="form.productModel"
            placeholder="请输入商品型号，如 CTRL-200A"
            @input="updateTextField('productModel', $event)"
          />
        </label>
        <label>
          问题方向 <span>*</span>
          <select :value="form.category" @change="updateCategory">
            <option v-for="category in categories" :key="category.key" :value="category.key">
              {{ category.label }}
            </option>
          </select>
        </label>
        <label>
          问题标题 <span>*</span>
          <input
            :value="form.title"
            placeholder="请简明扼要输入问题标题"
            @input="updateTextField('title', $event)"
          />
        </label>
        <label>
          问题描述 <span>*</span>
          <textarea
            :value="form.question"
            rows="5"
            maxlength="500"
            placeholder="请详细描述您的问题，以便我们更准确地为您解答"
            @input="updateTextField('question', $event)"
          ></textarea>
          <small>{{ descriptionCount }}/500</small>
        </label>
        <p v-if="submittedMessage" class="qa-modal__message">{{ submittedMessage }}</p>
      </div>

      <footer class="qa-modal__footer">
        <button type="button" class="qa-modal__cancel" @click="emit('close')">取消</button>
        <button
          type="button"
          class="qa-modal__submit"
          :disabled="submitting || !canSubmitQuestion"
          @click="emit('submit')"
        >
          <AppIcon :icon="Send" :size="15" />
          {{ submitting ? '提交中' : '提交问题' }}
        </button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.qa-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgb(15 23 42 / 45%);
}

.qa-modal {
  width: min(640px, 100%);
  overflow: hidden;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 24px 80px rgb(15 23 42 / 28%);
}

.qa-modal h2 {
  margin: 0;
}

.qa-modal__header,
.qa-modal__footer,
.qa-modal__submit {
  display: flex;
  align-items: center;
}

.qa-modal__header {
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid #edf2f8;
}

.qa-modal__header button {
  font: inherit;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.qa-modal__body {
  display: grid;
  gap: 14px;
  padding: 20px;
}

.qa-modal__body label {
  display: grid;
  gap: 7px;
  font-weight: 800;
  color: #25334d;
}

.qa-modal__body label span,
.qa-modal__message {
  color: #ef4c3c;
}

.qa-modal select,
.qa-modal input,
.qa-modal textarea {
  width: 100%;
  font: inherit;
  background: #fff;
  border: 1px solid #d9e3f0;
  border-radius: 10px;
}

.qa-modal select,
.qa-modal input {
  height: 42px;
  padding: 0 12px;
}

.qa-modal textarea {
  min-height: 120px;
  padding: 10px 12px;
  resize: vertical;
}

.qa-modal small {
  justify-self: end;
  color: #7d8da8;
}

.qa-modal__footer {
  gap: 10px;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid #edf2f8;
}

.qa-modal__cancel {
  height: 42px;
  padding: 0 18px;
  font: inherit;
  font-weight: 800;
  color: #4a5b78;
  cursor: pointer;
  background: #fff;
  border: 1px solid #d9e3f0;
  border-radius: 12px;
}

.qa-modal__submit {
  gap: 7px;
  height: 42px;
  padding: 0 22px;
  font: inherit;
  font-weight: 800;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(135deg, #1677ff, #0f63d4);
  border: 0;
  border-radius: 12px;
  box-shadow: 0 12px 24px rgb(22 119 255 / 18%);
}

.qa-modal__submit:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
