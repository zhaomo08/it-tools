<script setup lang="ts">
import LlmUsageNote from '../llm-shared/llm-usage-note.vue';
import { formatNumber } from '../llm-shared/calculators';

const contextWindow = ref(128000);
const systemTokens = ref(1200);
const toolSchemaTokens = ref(6000);
const historyTokens = ref(18000);
const ragChunkTokens = ref(900);
const ragChunks = ref(30);
const userTokens = ref(1200);
const outputReserve = ref(4000);
const safetyPercent = ref(10);
const { t } = useI18n();
const tt = (key: string, fallback: string) => t(`tools.llm-context-planner.${key}`, fallback);

const ragTokens = computed(() => ragChunkTokens.value * ragChunks.value);
const safetyReserve = computed(() => contextWindow.value * safetyPercent.value / 100);
const usedTokens = computed(() =>
  systemTokens.value + toolSchemaTokens.value + historyTokens.value + ragTokens.value + userTokens.value + outputReserve.value + safetyReserve.value,
);
const remainingTokens = computed(() => contextWindow.value - usedTokens.value);
const usagePercent = computed(() => Math.min(100, Math.max(0, usedTokens.value / contextWindow.value * 100)));
const maxChunks = computed(() => Math.max(0, Math.floor((contextWindow.value - usedTokens.value + ragTokens.value) / Math.max(1, ragChunkTokens.value))));
const status = computed(() => {
  if (remainingTokens.value < 0) {
    return tt('status.overBudget', 'Over budget');
  }
  if (usagePercent.value > 85) {
    return tt('status.tight', 'Tight');
  }
  return tt('status.healthy', 'Healthy');
});
const statusClass = computed(() => {
  if (remainingTokens.value < 0) {
    return 'status-danger';
  }
  if (usagePercent.value > 85) {
    return 'status-warning';
  }
  return 'status-ok';
});
const statusIcon = computed(() => {
  if (remainingTokens.value < 0) {
    return '✕';
  }
  if (usagePercent.value > 85) {
    return '!';
  }
  return '✓';
});
const breakdownItems = computed(() => [
  { key: 'system', label: tt('breakdown.system', 'System'), value: systemTokens.value },
  { key: 'tools', label: tt('breakdown.tools', 'Tools'), value: toolSchemaTokens.value },
  { key: 'history', label: tt('breakdown.history', 'History'), value: historyTokens.value },
  { key: 'rag', label: 'RAG', value: ragTokens.value },
  { key: 'output', label: tt('breakdown.output', 'Output'), value: outputReserve.value },
  { key: 'free', label: tt('breakdown.free', 'Free'), value: Math.max(0, remainingTokens.value) },
]);
</script>

<template>
  <div class="planner-root">
    <LlmUsageNote
      :what="tt('usage.what', '')"
      :steps="[tt('usage.step1', ''), tt('usage.step2', ''), tt('usage.step3', '')]"
      :tip="tt('usage.tip', '')"
    />

    <!-- ── Row 1: Inputs + Fit Check ── -->
    <div class="top-row">
      <!-- Left: inputs in 2-col grid -->
      <div class="panel inputs-panel">
        <div class="panel-head">
          <span class="dot dot-amber" />
          <span class="panel-label">{{ tt('sections.contextBudget', 'Context Budget') }}</span>
        </div>

        <div class="input-grid">
          <!-- Context window spans full width -->
          <div class="field-block span2">
            <label>{{ tt('fields.contextWindow', 'Context window') }}</label>
            <n-input-number v-model:value="contextWindow" :min="1000" :step="1000" w-full />
          </div>

          <div class="field-block">
            <label>{{ tt('fields.systemPrompt', 'System prompt') }}</label>
            <n-input-number v-model:value="systemTokens" :min="0" :step="100" w-full />
          </div>
          <div class="field-block">
            <label>{{ tt('fields.toolSchemas', 'Tool schemas') }}</label>
            <n-input-number v-model:value="toolSchemaTokens" :min="0" :step="100" w-full />
          </div>
          <div class="field-block">
            <label>{{ tt('fields.conversationHistory', 'History') }}</label>
            <n-input-number v-model:value="historyTokens" :min="0" :step="1000" w-full />
          </div>
          <div class="field-block">
            <label>{{ tt('fields.userTurn', 'User turn') }}</label>
            <n-input-number v-model:value="userTokens" :min="0" :step="100" w-full />
          </div>
          <div class="field-block">
            <label>{{ tt('fields.outputReserve', 'Output reserve') }}</label>
            <n-input-number v-model:value="outputReserve" :min="0" :step="500" w-full />
          </div>
          <div class="field-block">
            <label>{{ tt('fields.safetyReserve', 'Safety reserve') }} <strong class="mono">{{ safetyPercent }}%</strong></label>
            <n-slider v-model:value="safetyPercent" :min="0" :max="30" />
          </div>
        </div>

        <!-- RAG sub-group -->
        <div class="rag-group">
          <div class="rag-group-label">
            <span class="dot dot-purple" style="width:5px;height:5px;" />
            RAG
          </div>
          <div class="rag-fields">
            <div class="field-block">
              <label>{{ tt('fields.ragChunkTokens', 'Chunk tokens') }}</label>
              <n-input-number v-model:value="ragChunkTokens" :min="1" :step="100" w-full />
            </div>
            <div class="field-block">
              <label>{{ tt('fields.ragChunks', 'Chunks') }}</label>
              <n-input-number v-model:value="ragChunks" :min="0" :step="1" w-full />
            </div>
            <div class="rag-total">
              <span>{{ tt('breakdown.rag', 'RAG total') }}</span>
              <span class="mono">{{ formatNumber(ragTokens) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: fit check -->
      <div class="panel fit-panel">
        <div class="panel-head">
          <span class="dot dot-green" />
          <span class="panel-label">{{ tt('sections.fitCheck', 'Fit Check') }}</span>
        </div>

        <div class="status-block" :class="statusClass">
          <span class="status-icon">{{ statusIcon }}</span>
          <span class="status-text">{{ status }}</span>
        </div>

        <div class="usage-bar-wrap">
          <n-progress
            type="line"
            :percentage="usagePercent"
            :status="remainingTokens < 0 ? 'error' : usagePercent > 85 ? 'warning' : 'success'"
            :show-indicator="false"
          />
          <div class="usage-label">
            <span class="mono">{{ usagePercent.toFixed(1) }}%</span>
            <span>used</span>
          </div>
        </div>

        <div class="fit-metrics">
          <div class="fit-row">
            <span>{{ tt('metrics.used', 'Used') }}</span>
            <span class="mono">{{ formatNumber(usedTokens) }}</span>
          </div>
          <div class="fit-row">
            <span>{{ tt('metrics.remaining', 'Remaining') }}</span>
            <span class="mono" :class="{ danger: remainingTokens < 0 }">{{ formatNumber(remainingTokens) }}</span>
          </div>
          <div class="fit-row highlight">
            <span>{{ tt('metrics.ragBudget', 'Max RAG chunks') }}</span>
            <span class="mono">{{ formatNumber(maxChunks) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Row 2: Breakdown bar chart ── -->
    <div class="panel breakdown-panel">
      <div class="panel-head">
        <span class="dot dot-slate" />
        <span class="panel-label">{{ tt('sections.breakdown', 'Breakdown') }}</span>
      </div>

      <!-- Stacked bar -->
      <div class="stacked-bar">
        <div class="stacked-seg seg-system" :style="{ width: `${systemTokens / contextWindow * 100}%` }" />
        <div class="stacked-seg seg-tools" :style="{ width: `${toolSchemaTokens / contextWindow * 100}%` }" />
        <div class="stacked-seg seg-history" :style="{ width: `${historyTokens / contextWindow * 100}%` }" />
        <div class="stacked-seg seg-rag" :style="{ width: `${ragTokens / contextWindow * 100}%` }" />
        <div class="stacked-seg seg-output" :style="{ width: `${outputReserve / contextWindow * 100}%` }" />
        <div class="stacked-seg seg-free" :style="{ width: `${Math.max(0, remainingTokens) / contextWindow * 100}%` }" />
      </div>

      <div class="bar-legend">
        <div v-for="item in breakdownItems" :key="item.key" class="legend-item">
          <span class="legend-dot" :class="`seg-${item.key}`" />
          <span class="legend-label">{{ item.label }}</span>
          <span class="mono legend-value">{{ formatNumber(item.value) }}</span>
          <span class="legend-pct">{{ (item.value / contextWindow * 100).toFixed(1) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
/* ── Root ── */
.planner-root {
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-family: 'DM Sans', sans-serif;
}

.top-row {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 14px;
  align-items: start;
}

/* ── Panel ── */
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
  margin-bottom: 16px;
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
.dot-amber  { background: #f59e0b; }
.dot-green  { background: #22c55e; }
.dot-purple { background: #a855f7; }
.dot-slate  { background: #64748b; }

/* ── Inputs panel ── */
.inputs-panel { border-top: 3px solid #f59e0b; }

.input-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 14px;
  margin-bottom: 16px;
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
}

.span2 { grid-column: span 2; }

/* ── RAG group ── */
.rag-group {
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  padding: 12px 14px;
  .dark & { border-color: #21262d; }
}

.rag-group-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #a855f7;
  margin-bottom: 10px;
}

.rag-fields {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 10px 14px;
  align-items: end;
}

.rag-total {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 4px;
  font-size: 12px;
  color: #9ca3af;
  .dark & { color: #6e7681; }
  .mono { color: #a855f7; font-size: 15px; }
}

/* ── Fit panel ── */
.fit-panel { border-top: 3px solid #22c55e; }

.status-block {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  margin-bottom: 14px;
  background: #f0fdf4;
  .dark & { background: rgba(34,197,94,0.08); }

  &.status-warning {
    background: #fffbeb;
    .dark & { background: rgba(245,158,11,0.08); }
    .status-icon { background: #f59e0b; }
    .status-text { color: #92400e; .dark & { color: #fbbf24; } }
  }

  &.status-danger {
    background: #fff1f2;
    .dark & { background: rgba(220,38,38,0.08); }
    .status-icon { background: #dc2626; }
    .status-text { color: #991b1b; .dark & { color: #f87171; } }
  }
}

.status-icon {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: #22c55e;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-text {
  font-size: 18px;
  font-weight: 700;
  color: #15803d;
  .dark & { color: #4ade80; }
}

.usage-bar-wrap {
  margin-bottom: 14px;
}

.usage-label {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  font-size: 11px;
  color: #9ca3af;
  .dark & { color: #6e7681; }
}

.fit-metrics {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.fit-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 13px;
  border-bottom: 1px solid #f0f0f0;
  color: #374151;
  gap: 8px;
  .dark & { border-color: #21262d; color: #8b949e; }

  &.highlight {
    border-bottom: none;
    color: #a855f7;
    .mono { color: #a855f7; }
  }
}

.danger { color: #dc2626 !important; }

/* ── Breakdown ── */
.breakdown-panel { border-top: 3px solid #64748b; }

.stacked-bar {
  display: flex;
  height: 14px;
  border-radius: 999px;
  overflow: hidden;
  background: #f0f0f0;
  margin-bottom: 16px;
  .dark & { background: #21262d; }
}

.stacked-seg {
  height: 100%;
  min-width: 2px;
  transition: width 0.3s ease;
}

.bar-legend {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
}

.legend-dot {
  width: 10px; height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}

.legend-label {
  flex: 1;
  color: #374151;
  .dark & { color: #8b949e; }
}

.legend-value {
  font-size: 13px;
  font-weight: 700;
  color: #111827;
  .dark & { color: #e6edf3; }
}

.legend-pct {
  font-size: 11px;
  color: #9ca3af;
  width: 38px;
  text-align: right;
  .dark & { color: #6e7681; }
}

/* Segment colors */
.seg-system  { background: #3b82f6; }
.seg-tools   { background: #f59e0b; }
.seg-history { background: #f97316; }
.seg-rag     { background: #a855f7; }
.seg-output  { background: #14b8a6; }
.seg-free    { background: #e5e7eb; .dark & { background: #30363d; } }

.mono {
  font-family: 'Space Mono', monospace;
  font-weight: 700;
}

/* ── Responsive ── */
@media (max-width: 860px) {
  .top-row { grid-template-columns: 1fr; }
  .bar-legend { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 520px) {
  .input-grid { grid-template-columns: 1fr; .span2 { grid-column: span 1; } }
  .rag-fields { grid-template-columns: 1fr 1fr; .rag-total { grid-column: span 2; } }
  .bar-legend { grid-template-columns: 1fr; }
}
</style>
