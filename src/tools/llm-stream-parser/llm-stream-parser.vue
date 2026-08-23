<script setup lang="ts">
import LlmUsageNote from '../llm-shared/llm-usage-note.vue';
import { formatNumber } from '../llm-shared/calculators';
import { parseStream } from './llm-stream-parser.service';
import { useCopy } from '@/composable/copy';

const { t } = useI18n();
const tt = (key: string, fallback: string) => t(`tools.llm-stream-parser.${key}`, fallback);

const raw = ref(`data: {"model":"gpt-4o-mini","choices":[{"delta":{"role":"assistant","content":""}}]}

data: {"choices":[{"delta":{"content":"Streaming "}}]}

data: {"choices":[{"delta":{"content":"responses "}}]}

data: {"choices":[{"delta":{"content":"are hard to read raw."},"finish_reason":"stop"}]}

data: {"usage":{"prompt_tokens":24,"completion_tokens":8,"total_tokens":32}}

data: [DONE]`);

const result = computed(() => parseStream(raw.value));
const usageEntries = computed(() => Object.entries(result.value.usage ?? {}));

const { copy: copyText } = useCopy({
  source: computed(() => result.value.text),
  text: tt('messages.copied', 'Reconstructed text copied to clipboard'),
});
</script>

<template>
  <div class="stream-root">
    <LlmUsageNote
      :what="tt('usage.what', '')"
      :steps="[tt('usage.step1', ''), tt('usage.step2', ''), tt('usage.step3', '')]"
      :tip="tt('usage.tip', '')"
    />

    <div class="top-row">
      <div class="panel raw-panel">
        <div class="panel-head">
          <span class="dot dot-orange" />
          <span class="panel-label">{{ tt('sections.raw', 'Raw SSE Stream') }}</span>
        </div>
        <c-input-text
          v-model:value="raw"
          rows="14"
          raw-text multiline
          :placeholder="tt('placeholders.raw', 'Paste the raw stream, data: lines and all...')"
        />
      </div>

      <div class="panel stats-panel">
        <div class="panel-head">
          <span class="dot dot-violet" />
          <span class="panel-label">{{ tt('sections.stats', 'Stream Stats') }}</span>
        </div>

        <div class="stat-hero">
          <span class="mono stat-value">{{ formatNumber(result.contentChunks) }}</span>
          <span class="stat-caption">{{ tt('metrics.contentChunks', 'content chunks') }}</span>
        </div>

        <div class="stat-row">
          <span class="stat-key">{{ tt('metrics.payloads', 'Payloads') }}</span>
          <span class="mono stat-num">{{ formatNumber(result.payloads) }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-key">{{ tt('metrics.model', 'Model') }}</span>
          <span class="mono stat-num">{{ result.model ?? '—' }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-key">{{ tt('metrics.finishReason', 'Finish reason') }}</span>
          <span class="mono stat-num">{{ result.finishReason ?? '—' }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-key">{{ tt('metrics.done', '[DONE] marker') }}</span>
          <span class="mono stat-num">{{ result.doneMarker ? 'yes' : 'no' }}</span>
        </div>
        <div v-for="[key, value] in usageEntries" :key="key" class="stat-row">
          <span class="stat-key">{{ key }}</span>
          <span class="mono stat-num">{{ formatNumber(value) }}</span>
        </div>
      </div>
    </div>

    <div class="panel text-panel">
      <div class="panel-head">
        <span class="dot dot-teal" />
        <span class="panel-label">{{ tt('sections.text', 'Reconstructed Text') }}</span>
        <span class="mono char-count">{{ formatNumber(result.text.length) }} ch</span>
      </div>
      <c-input-text
        :value="result.text"
        multiline
        rows="6"
        raw-text
        readonly
        :placeholder="tt('placeholders.text', 'The assembled assistant message will appear here.')"
      />
      <div class="panel-actions">
        <c-button :disabled="result.text.length === 0" @click="copyText()">
          {{ tt('actions.copyText', 'Copy text') }}
        </c-button>
      </div>
    </div>

    <div v-if="result.reasoning" class="panel reasoning-panel">
      <div class="panel-head">
        <span class="dot dot-amber" />
        <span class="panel-label">{{ tt('sections.reasoning', 'Reasoning / Thinking') }}</span>
      </div>
      <c-input-text :value="result.reasoning" multiline rows="4" raw-text readonly />
    </div>

    <div v-if="result.toolArguments" class="panel tool-panel">
      <div class="panel-head">
        <span class="dot dot-blue" />
        <span class="panel-label">{{ tt('sections.toolCalls', 'Tool Call Arguments') }}</span>
      </div>
      <c-input-text :value="result.toolArguments" multiline rows="4" raw-text readonly />
    </div>

    <div v-if="result.errors.length > 0" class="panel error-panel">
      <div class="panel-head">
        <span class="dot dot-rose" />
        <span class="panel-label">{{ tt('sections.errors', 'Malformed Payloads') }}</span>
        <span class="mono char-count">{{ result.errors.length }}</span>
      </div>
      <div v-for="error in result.errors" :key="error" class="error-line">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.stream-root {
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
.dot-blue   { background: #3b82f6; }
.dot-rose   { background: #f43f5e; }

.raw-panel       { border-top: 3px solid #f97316; }
.stats-panel     { border-top: 3px solid #8b5cf6; }
.text-panel      { border-top: 3px solid #14b8a6; }
.reasoning-panel { border-top: 3px solid #f59e0b; }
.tool-panel      { border-top: 3px solid #3b82f6; }
.error-panel     { border-top: 3px solid #f43f5e; }

.stat-hero {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-bottom: 12px;
  margin-bottom: 10px;
  border-bottom: 1px dashed #e5e7eb;
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

.stat-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  padding: 4px 0;
  font-size: 13px;
}

.stat-key {
  color: #6b7280;
  .dark & { color: #8b949e; }
}

.stat-num {
  font-size: 12px;
  overflow-wrap: anywhere;
  text-align: right;
}

.char-count {
  font-size: 12px;
  color: #9ca3af;
}

.error-line {
  padding: 6px 9px;
  margin-bottom: 6px;
  border-radius: 8px;
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  overflow-wrap: anywhere;
  background: rgba(244, 63, 94, 0.08);
  color: #be123c;
  .dark & { background: rgba(244, 63, 94, 0.12); color: #fb7185; }
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
