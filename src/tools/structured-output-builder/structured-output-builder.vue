<script setup lang="ts">
import LlmUsageNote from '../llm-shared/llm-usage-note.vue';
import type { InputMode, OutputTarget } from './structured-output-builder.service';
import { buildStructuredOutput } from './structured-output-builder.service';
import { useCopy } from '@/composable/copy';

const { t } = useI18n();
const tt = (key: string, fallback: string) => t(`tools.structured-output-builder.${key}`, fallback);

const input = ref(`{
  "sentiment": "positive",
  "score": 4,
  "topics": ["pricing", "onboarding"],
  "summary": "The customer likes the price but got lost during setup."
}`);

const mode = ref<InputMode>('sample');
const target = ref<OutputTarget>('openai');
const name = ref('review_analysis');

const modeOptions = computed(() => [
  { label: tt('options.sample', 'JSON sample (infer the schema)'), value: 'sample' },
  { label: tt('options.schema', 'JSON Schema (use as is)'), value: 'schema' },
]);

const targetOptions = [
  { label: 'OpenAI · response_format', value: 'openai' },
  { label: 'Anthropic · forced tool', value: 'anthropic' },
  { label: 'Gemini · responseSchema', value: 'gemini' },
];

const result = computed(() => buildStructuredOutput(input.value, mode.value, target.value, name.value));

const { copy: copyOutput } = useCopy({
  source: computed(() => result.value.output),
  text: tt('messages.copied', 'Configuration copied to clipboard'),
});
</script>

<template>
  <div class="structured-root">
    <LlmUsageNote
      :what="tt('usage.what', '')"
      :steps="[tt('usage.step1', ''), tt('usage.step2', ''), tt('usage.step3', '')]"
      :tip="tt('usage.tip', '')"
    />

    <div class="top-row">
      <div class="input-panel panel">
        <div class="panel-head">
          <span class="dot dot-orange" />
          <span class="panel-label">{{ tt('sections.input', 'Desired Output') }}</span>
        </div>
        <c-input-text
          v-model:value="input"
          rows="16"
          raw-text multiline
          :placeholder="tt('placeholders.input', 'Paste the JSON you want the model to return, or a JSON Schema...')"
        />
        <div v-if="result.error" class="error-line">
          {{ result.error }}
        </div>
      </div>

      <div class="panel settings-panel">
        <div class="panel-head">
          <span class="dot dot-violet" />
          <span class="panel-label">{{ tt('sections.settings', 'Build') }}</span>
        </div>

        <div class="field">
          <span class="field-label">{{ tt('fields.mode', 'Input is') }}</span>
          <c-select v-model:value="mode" :options="modeOptions" w-full />
        </div>
        <div class="field">
          <span class="field-label">{{ tt('fields.target', 'Target') }}</span>
          <c-select v-model:value="target" :options="targetOptions" w-full />
        </div>
        <div class="field">
          <span class="field-label">{{ tt('fields.name', 'Schema name') }}</span>
          <c-input-text v-model:value="name" raw-text size="small" />
        </div>

        <p class="hint">
          {{ tt('messages.hint', 'Anthropic has no response_format — a forced single tool call is the equivalent way to pin the output shape.') }}
        </p>
      </div>
    </div>

    <div class="panel output-panel">
      <div class="panel-head">
        <span class="dot dot-teal" />
        <span class="panel-label">{{ tt('sections.output', 'Request Configuration') }}</span>
      </div>
      <c-input-text
        :value="result.output"
        multiline
        rows="16"
        raw-text
        readonly
        :placeholder="tt('placeholders.output', 'The request configuration will appear here.')"
      />
      <div class="panel-actions">
        <c-button :disabled="result.output.length === 0" @click="copyOutput()">
          {{ tt('actions.copy', 'Copy configuration') }}
        </c-button>
      </div>
    </div>

    <div v-if="result.notes.length > 0" class="panel notes-panel">
      <div class="panel-head">
        <span class="dot dot-amber" />
        <span class="panel-label">{{ tt('sections.notes', 'Schema Adjustments') }}</span>
        <span class="count mono">{{ result.notes.length }}</span>
      </div>
      <div v-for="note in result.notes" :key="note" class="note-line">
        {{ note }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.structured-root {
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
.dot-amber  { background: #f59e0b; }

.input-panel    { border-top: 3px solid #f97316; }
.settings-panel { border-top: 3px solid #8b5cf6; }
.output-panel   { border-top: 3px solid #14b8a6; }
.notes-panel    { border-top: 3px solid #f59e0b; }

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

.count {
  font-size: 12px;
  color: #9ca3af;
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

.note-line {
  padding: 6px 9px;
  margin-bottom: 6px;
  border-radius: 8px;
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  overflow-wrap: anywhere;
  background: rgba(245, 158, 11, 0.08);
  color: #b45309;
  .dark & { background: rgba(245, 158, 11, 0.12); color: #fbbf24; }
}

.panel-actions { margin-top: 12px; }

.mono {
  font-family: 'Space Mono', monospace;
  font-weight: 700;
}

@media (max-width: 860px) {
  .top-row { grid-template-columns: 1fr; }
}
</style>
