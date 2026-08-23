<script setup lang="ts">
import LlmUsageNote from '../llm-shared/llm-usage-note.vue';
import { formatNumber } from '../llm-shared/calculators';
import { useCopy } from '@/composable/copy';

const { t } = useI18n();
const tt = (key: string, fallback: string) => t(`tools.jsonl-chat-builder.${key}`, fallback);

const model = ref('gpt-4o-mini');
const temperature = ref(0.2);
const systemPrompt = ref('You are a concise B2B assistant. Reply with clear structure and practical next steps.');
const userInputs = ref(`Summarize this customer feedback thread in 5 bullets.
Rewrite this onboarding email to sound warm and direct.
Extract action items, owners, and due dates from this meeting note.
Generate 3 subject lines for a product launch update.`);

const prompts = computed(() =>
  userInputs.value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean),
);

const jsonlOutput = computed(() =>
  prompts.value
    .map((prompt, index) => {
      const body: Record<string, unknown> = {
        model: model.value,
        temperature: temperature.value,
        messages: [
          ...(systemPrompt.value.trim() ? [{ role: 'system', content: systemPrompt.value.trim() }] : []),
          { role: 'user', content: prompt },
        ],
      };

      return JSON.stringify({
        custom_id: `req-${index + 1}`,
        method: 'POST',
        url: '/v1/chat/completions',
        body,
      });
    })
    .join('\n'),
);

const estimatedChars = computed(() => jsonlOutput.value.length);

const { copy: copyJsonl } = useCopy({
  source: jsonlOutput,
  text: tt('messages.copied', 'JSONL copied to clipboard'),
});
</script>

<template>
  <div class="builder-root">
    <LlmUsageNote
      :what="tt('usage.what', '')"
      :steps="[tt('usage.step1', ''), tt('usage.step2', ''), tt('usage.step3', '')]"
      :tip="tt('usage.tip', '')"
    />

    <!-- Row 1: Config left · Prompts right -->
    <div class="top-row">
      <div class="panel config-panel">
        <div class="panel-head">
          <span class="dot dot-rose" />
          <span class="panel-label">{{ tt('sections.config', 'Batch Config') }}</span>
        </div>

        <!-- Model + Temp 2-col -->
        <div class="field-row">
          <div class="field-block">
            <label>{{ tt('fields.model', 'Model') }}</label>
            <c-input-text v-model:value="model" raw-text />
          </div>
          <div class="field-block">
            <label>{{ tt('fields.temperature', 'Temperature') }}</label>
            <n-input-number v-model:value="temperature" :min="0" :max="2" :step="0.1" w-full />
          </div>
        </div>

        <!-- System prompt -->
        <div class="field-block mt">
          <label>{{ tt('fields.systemPrompt', 'System prompt') }}</label>
          <c-input-text v-model:value="systemPrompt" rows="5" raw-text multiline />
        </div>
      </div>

      <div class="panel prompts-panel">
        <div class="panel-head">
          <span class="dot dot-sky" />
          <span class="panel-label">{{ tt('sections.userInputs', 'User Prompts') }}</span>
          <span class="mono prompt-count">{{ prompts.length }}</span>
        </div>
        <c-input-text
          v-model:value="userInputs"
          multiline
          rows="10"
          raw-text
          :placeholder="tt('placeholders.userInputs', 'One user prompt per line...')"
        />
      </div>
    </div>

    <!-- Row 2: Output -->
    <div class="panel output-panel">
      <div class="panel-head">
        <span class="dot dot-slate" />
        <span class="panel-label">{{ tt('sections.output', 'JSONL Output') }}</span>
        <div class="output-stats">
          <span class="ostat">
            <span class="mono ostat-n">{{ formatNumber(prompts.length) }}</span>
            <span class="ostat-l">{{ tt('metrics.requests', 'requests') }}</span>
          </span>
          <span class="ostat-sep">·</span>
          <span class="ostat">
            <span class="ostat-n mono">{{ formatNumber(estimatedChars) }}</span>
            <span class="ostat-l">{{ tt('metrics.characters', 'chars') }}</span>
          </span>
        </div>
      </div>
      <c-input-text
        :value="jsonlOutput"
        multiline
        rows="10"
        raw-text
        readonly
      />
      <div class="panel-actions">
        <c-button :disabled="!jsonlOutput" @click="copyJsonl()">
          {{ tt('actions.copyJsonl', 'Copy JSONL') }}
        </c-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.builder-root {
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-family: 'DM Sans', sans-serif;
}

.top-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
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
  flex-wrap: wrap;
}

.panel-label {
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
.dot-rose  { background: #f43f5e; }
.dot-sky   { background: #0ea5e9; }
.dot-slate { background: #64748b; }

.config-panel  { border-top: 3px solid #f43f5e; }
.prompts-panel { border-top: 3px solid #0ea5e9; }
.output-panel  { border-top: 3px solid #64748b; }

/* prompt count badge */
.prompt-count {
  font-size: 20px;
  font-weight: 700;
  color: #0ea5e9;
  line-height: 1;
}

/* 2-col field row */
.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field-block {
  display: flex;
  flex-direction: column;
  gap: 5px;
  label {
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
    .dark & { color: #8b949e; }
  }
  &.mt { margin-top: 12px; }
}

/* Output stats */
.output-stats {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}

.ostat {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 12px;
}

.ostat-n {
  font-size: 15px;
  font-weight: 700;
  color: #22c55e;
  .dark & { color: #4ade80; }
}

.ostat-l {
  color: #9ca3af;
  .dark & { color: #6e7681; }
}

.ostat-sep {
  color: #d1d5db;
  .dark & { color: #30363d; }
}

.panel-actions {
  margin-top: 12px;
}

.mono {
  font-family: 'Space Mono', monospace;
  font-weight: 700;
}

@media (max-width: 860px) {
  .top-row { grid-template-columns: 1fr; }
  .output-stats { margin-left: 0; }
}
</style>
