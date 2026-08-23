<script setup lang="ts">
import LlmUsageNote from '../llm-shared/llm-usage-note.vue';
import type { ToolFormat } from './tool-schema-converter.service';
import { convertTools } from './tool-schema-converter.service';
import { useCopy } from '@/composable/copy';

const { t } = useI18n();
const tt = (key: string, fallback: string) => t(`tools.tool-schema-converter.${key}`, fallback);

const input = ref(`{
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get the current weather for a city.",
        "parameters": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "city": { "type": "string", "description": "City name, e.g. Shanghai" },
            "unit": { "type": "string", "enum": ["celsius", "fahrenheit"] },
            "days": { "type": ["integer", "null"], "description": "Forecast length" }
          },
          "required": ["city"]
        }
      }
    }
  ]
}`);

const target = ref<ToolFormat>('gemini');

const targetOptions = [
  { label: 'OpenAI · tools', value: 'openai' },
  { label: 'Anthropic · tools', value: 'anthropic' },
  { label: 'Gemini · functionDeclarations', value: 'gemini' },
];

const result = computed(() => convertTools(input.value, target.value));

const { copy: copyOutput } = useCopy({
  source: computed(() => result.value.output),
  text: tt('messages.copied', 'Tool definitions copied to clipboard'),
});
</script>

<template>
  <div class="schema-root">
    <LlmUsageNote
      :what="tt('usage.what', '')"
      :steps="[tt('usage.step1', ''), tt('usage.step2', ''), tt('usage.step3', '')]"
      :tip="tt('usage.tip', '')"
    />

    <div class="top-row">
      <div class="input-panel panel">
        <div class="panel-head">
          <span class="dot dot-orange" />
          <span class="panel-label">{{ tt('sections.input', 'Source Definitions') }}</span>
          <span v-if="!result.error" class="source-badge">{{ result.source }}</span>
        </div>
        <c-input-text
          v-model:value="input"
          rows="18"
          raw-text multiline
          :placeholder="tt('placeholders.input', 'Paste OpenAI tools, Anthropic tools, or Gemini functionDeclarations...')"
        />
        <div v-if="result.error" class="error-line">
          {{ result.error }}
        </div>
      </div>

      <div class="settings-panel panel">
        <div class="panel-head">
          <span class="dot dot-violet" />
          <span class="panel-label">{{ tt('sections.target', 'Target') }}</span>
        </div>

        <div class="field">
          <span class="field-label">{{ tt('fields.format', 'Output format') }}</span>
          <c-select v-model:value="target" :options="targetOptions" w-full />
        </div>

        <div class="stat-hero">
          <span class="stat-value mono">{{ result.tools }}</span>
          <span class="stat-caption">{{ tt('metrics.tools', 'tool definitions') }}</span>
        </div>

        <p class="hint">
          {{ tt('messages.hint', 'Gemini accepts only a subset of JSON Schema. Unsupported keywords are dropped and listed below.') }}
        </p>
      </div>
    </div>

    <div class="output-panel panel">
      <div class="panel-head">
        <span class="dot dot-teal" />
        <span class="panel-label">{{ tt('sections.output', 'Converted Definitions') }}</span>
      </div>
      <c-input-text
        :value="result.output"
        multiline
        rows="16"
        raw-text
        readonly
        :placeholder="tt('placeholders.output', 'The converted tool definitions will appear here.')"
      />
      <div class="panel-actions">
        <c-button :disabled="result.output.length === 0" @click="copyOutput()">
          {{ tt('actions.copy', 'Copy definitions') }}
        </c-button>
      </div>
    </div>

    <div v-if="result.warnings.length > 0" class="panel warning-panel">
      <div class="panel-head">
        <span class="dot dot-amber" />
        <span class="panel-label">{{ tt('sections.warnings', 'Dropped Keywords') }}</span>
        <span class="mono count">{{ result.warnings.length }}</span>
      </div>
      <div v-for="warning in result.warnings" :key="warning" class="warning-line">
        {{ warning }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.schema-root {
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
.warning-panel  { border-top: 3px solid #f59e0b; }

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

.stat-hero {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 12px;
  margin-top: 4px;
  border-top: 1px dashed #e5e7eb;
  .dark & { border-color: #30363d; }
}

.stat-value {
  font-size: 30px;
  line-height: 1;
  color: #8b5cf6;
}

.stat-caption {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9ca3af;
  .dark & { color: #6e7681; }
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

.warning-line {
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
