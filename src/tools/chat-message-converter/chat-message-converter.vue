<script setup lang="ts">
import LlmUsageNote from '../llm-shared/llm-usage-note.vue';
import type { ChatFormat } from './chat-message-converter.service';
import { convert } from './chat-message-converter.service';
import { useCopy } from '@/composable/copy';

const { t } = useI18n();
const tt = (key: string, fallback: string) => t(`tools.chat-message-converter.${key}`, fallback);

const input = ref(`{
  "model": "gpt-4o-mini",
  "messages": [
    { "role": "system", "content": "You are a concise assistant." },
    { "role": "user", "content": "Compare RAG and fine-tuning in 3 bullets." },
    { "role": "assistant", "content": "1. Cost 2. Freshness 3. Control" },
    { "role": "user", "content": "Now pick one for a support bot." }
  ]
}`);

const target = ref<ChatFormat>('anthropic');
const model = ref('claude-opus-5');

const targetOptions = [
  { label: 'OpenAI · chat completions', value: 'openai' },
  { label: 'Anthropic · messages', value: 'anthropic' },
  { label: 'Gemini · generateContent', value: 'gemini' },
];

const result = computed(() => convert(input.value, target.value, model.value.trim() || 'model'));

const { copy: copyOutput } = useCopy({
  source: computed(() => result.value.output),
  text: tt('messages.copied', 'Payload copied to clipboard'),
});
</script>

<template>
  <div class="converter-root">
    <LlmUsageNote
      :what="tt('usage.what', '')"
      :steps="[tt('usage.step1', ''), tt('usage.step2', ''), tt('usage.step3', '')]"
      :tip="tt('usage.tip', '')"
    />

    <div class="top-row">
      <div class="input-panel panel">
        <div class="panel-head">
          <span class="dot dot-orange" />
          <span class="panel-label">{{ tt('sections.input', 'Source Payload') }}</span>
          <span v-if="!result.error" class="source-badge">{{ result.source }}</span>
        </div>
        <c-input-text
          v-model:value="input"
          rows="16"
          raw-text multiline
          :placeholder="tt('placeholders.input', 'Paste an OpenAI, Anthropic, or Gemini request body...')"
        />
        <div v-if="result.error" class="error-line">
          {{ result.error }}
        </div>
      </div>

      <div class="panel settings-panel">
        <div class="panel-head">
          <span class="dot dot-violet" />
          <span class="panel-label">{{ tt('sections.target', 'Target') }}</span>
        </div>

        <div class="field">
          <span class="field-label">{{ tt('fields.format', 'Output format') }}</span>
          <c-select v-model:value="target" :options="targetOptions" w-full />
        </div>
        <div class="field">
          <span class="field-label">{{ tt('fields.model', 'Model code') }}</span>
          <c-input-text v-model:value="model" raw-text size="small" />
        </div>

        <p class="hint">
          {{ tt('messages.hint', 'The source format is detected automatically. System prompts move in and out of the message list as each provider expects.') }}
        </p>
      </div>
    </div>

    <div class="panel output-panel">
      <div class="panel-head">
        <span class="dot dot-teal" />
        <span class="panel-label">{{ tt('sections.output', 'Converted Payload') }}</span>
      </div>
      <c-input-text
        :value="result.output"
        multiline
        rows="14"
        raw-text
        readonly
        :placeholder="tt('placeholders.output', 'The converted request body will appear here.')"
      />
      <div class="panel-actions">
        <c-button :disabled="result.output.length === 0" @click="copyOutput()">
          {{ tt('actions.copy', 'Copy payload') }}
        </c-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.converter-root {
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-family: 'DM Sans', sans-serif;
}

.top-row {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 14px;
  align-items: start;
}

.panel {
  padding: 18px 20px 20px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  .dark & { background: #161b22; border-color: #30363d; }
}

.panel-head {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 14px;
}

.panel-label {
  flex: 1;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #6b7280;
  .dark & { color: #6e7681; }
}

.dot {
  width: 6px; height: 6px;
  border-radius: 50%; flex-shrink: 0;
}
.dot-orange { background: #f97316; }
.dot-violet { background: #8b5cf6; }
.dot-teal   { background: #14b8a6; }

.input-panel    { border-top: 3px solid #f97316; }
.settings-panel { border-top: 3px solid #8b5cf6; }
.output-panel   { border-top: 3px solid #14b8a6; }

.source-badge {
  padding: 3px 8px;
  border-radius: 7px;
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  background: rgba(249, 115, 22, 0.1);
  border: 1px solid rgba(249, 115, 22, 0.25);
  color: #ea580c;
  .dark & { background: rgba(249, 115, 22, 0.12); color: #fb923c; }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.field-label {
  font-size: 12px;
  color: #6b7280;
  .dark & { color: #8b949e; }
}

.hint {
  margin: 12px 0 0;
  padding-top: 12px;
  border-top: 1px dashed #e5e7eb;
  font-size: 12px;
  line-height: 1.6;
  color: #9ca3af;
  .dark & { border-color: #30363d; color: #6e7681; }
}

.error-line {
  margin-top: 10px;
  padding: 6px 9px;
  border-radius: 8px;
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  overflow-wrap: anywhere;
  background: rgba(244, 63, 94, 0.08);
  color: #be123c;
  .dark & { background: rgba(244, 63, 94, 0.12); color: #fb7185; }
}

.panel-actions { margin-top: 12px; }

@media (max-width: 860px) {
  .top-row { grid-template-columns: 1fr; }
}
</style>
