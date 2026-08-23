<script setup lang="ts">
import LlmUsageNote from '../llm-shared/llm-usage-note.vue';
import { formatNumber } from '../llm-shared/calculators';
import { chunkText, toJsonl } from './rag-text-chunker.service';
import { useCopy } from '@/composable/copy';

const { t } = useI18n();
const tt = (key: string, fallback: string) => t(`tools.rag-text-chunker.${key}`, fallback);

const source = ref(`检索增强生成（RAG）的效果，一半取决于切块策略。

块太大，向量会被无关内容稀释，召回的相关性下降；块太小，又会丢掉回答问题所需的上下文，模型只能看到碎片。

A practical starting point is 500 to 1000 characters per chunk with a 10 to 15 percent overlap. The overlap keeps sentences that straddle a boundary retrievable from either side.

Always split on semantic boundaries first — paragraphs, then lines, then sentences — and only fall back to a hard character cut when no boundary is left.`);

const maxCharacters = ref(300);
const overlapCharacters = ref(40);
const sourceId = ref('document');

const chunks = computed(() => chunkText(source.value, {
  maxCharacters: maxCharacters.value,
  overlapCharacters: overlapCharacters.value,
}));

const totalTokens = computed(() => chunks.value.reduce((total, chunk) => total + chunk.tokens, 0));
const averageTokens = computed(() => (chunks.value.length === 0 ? 0 : totalTokens.value / chunks.value.length));
const jsonl = computed(() => toJsonl(chunks.value, sourceId.value.trim() || 'document'));

const { copy: copyJsonl } = useCopy({
  source: jsonl,
  text: tt('messages.copied', 'JSONL copied to clipboard'),
});
</script>

<template>
  <div class="chunker-root">
    <LlmUsageNote
      :what="tt('usage.what', '')"
      :steps="[tt('usage.step1', ''), tt('usage.step2', ''), tt('usage.step3', '')]"
      :tip="tt('usage.tip', '')"
    />

    <div class="top-row">
      <div class="panel source-panel">
        <div class="panel-head">
          <span class="dot dot-orange" />
          <span class="panel-label">{{ tt('sections.source', 'Source Document') }}</span>
          <span class="mono char-count">{{ formatNumber(source.length) }} ch</span>
        </div>
        <c-input-text
          v-model:value="source"
          rows="14"
          raw-text multiline
          :placeholder="tt('placeholders.source', 'Paste the document you want to embed...')"
        />
      </div>

      <div class="panel settings-panel">
        <div class="panel-head">
          <span class="dot dot-violet" />
          <span class="panel-label">{{ tt('sections.settings', 'Chunking') }}</span>
        </div>

        <div class="field">
          <span class="field-label">{{ tt('fields.maxCharacters', 'Max characters') }}</span>
          <n-input-number v-model:value="maxCharacters" :min="20" :step="50" w-full size="small" />
        </div>
        <div class="field">
          <span class="field-label">{{ tt('fields.overlap', 'Overlap characters') }}</span>
          <n-input-number v-model:value="overlapCharacters" :min="0" :step="10" w-full size="small" />
        </div>
        <div class="field">
          <span class="field-label">{{ tt('fields.sourceId', 'Source id') }}</span>
          <c-input-text v-model:value="sourceId" raw-text size="small" />
        </div>

        <div class="stat-hero">
          <span class="mono stat-value">{{ formatNumber(chunks.length) }}</span>
          <span class="stat-caption">{{ tt('metrics.chunks', 'chunks') }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-key">{{ tt('metrics.totalTokens', 'Total tokens') }}</span>
          <span class="mono stat-num">{{ formatNumber(totalTokens) }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-key">{{ tt('metrics.averageTokens', 'Avg per chunk') }}</span>
          <span class="mono stat-num">{{ formatNumber(averageTokens, 1) }}</span>
        </div>
      </div>
    </div>

    <div class="panel preview-panel">
      <div class="panel-head">
        <span class="dot dot-teal" />
        <span class="panel-label">{{ tt('sections.preview', 'Chunk Preview') }}</span>
      </div>

      <div v-if="chunks.length === 0" class="empty-state">
        <span class="empty-icon">∅</span>
        <span>{{ tt('messages.empty', 'Nothing to chunk yet') }}</span>
      </div>

      <div v-else class="chunk-list">
        <div v-for="chunk in chunks" :key="chunk.index" class="chunk-card">
          <div class="chunk-head">
            <span class="mono chunk-index">#{{ chunk.index }}</span>
            <span class="chunk-meta">{{ formatNumber(chunk.characters) }} ch · ~{{ formatNumber(chunk.tokens) }} tok</span>
          </div>
          <div class="chunk-body">
            {{ chunk.text }}
          </div>
        </div>
      </div>

      <div class="panel-actions">
        <c-button :disabled="chunks.length === 0" @click="copyJsonl()">
          {{ tt('actions.copyJsonl', 'Copy JSONL') }}
        </c-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.chunker-root {
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

.source-panel   { border-top: 3px solid #f97316; }
.settings-panel { border-top: 3px solid #8b5cf6; }
.preview-panel  { border-top: 3px solid #14b8a6; }

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

.stat-num { font-size: 12px; }

.char-count {
  font-size: 12px;
  color: #9ca3af;
}

.chunk-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 460px;
  overflow-y: auto;
}

.chunk-card {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #fafafa;
  .dark & { background: #0d1117; border-color: #30363d; }
}

.chunk-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 5px;
}

.chunk-index {
  font-size: 12px;
  color: #14b8a6;
}

.chunk-meta {
  font-size: 11px;
  color: #9ca3af;
  .dark & { color: #6e7681; }
}

.chunk-body {
  font-size: 13px;
  line-height: 1.55;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: #374151;
  .dark & { color: #c9d1d9; }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 24px 0;
  color: #9ca3af;
  font-size: 13px;
  .dark & { color: #6e7681; }
}

.empty-icon {
  font-size: 24px;
  opacity: 0.4;
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
