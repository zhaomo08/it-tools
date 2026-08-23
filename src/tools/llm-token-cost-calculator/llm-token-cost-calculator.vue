<script setup lang="ts">
import LlmUsageNote from '../llm-shared/llm-usage-note.vue';
import { costForMillionTokens, estimateTokens, formatMoney, formatNumber } from '../llm-shared/calculators';

const prompt = ref(`You are a careful coding assistant.

Context:
- Keep answers concise.
- Prefer local, private computation.

Task:
Estimate this prompt before sending it to an LLM.`);
const expectedOutputTokens = ref(800);
const callsPerDay = ref(100);
const cachedInputPercent = ref(60);
const inputPrice = ref(1);
const cachedInputPrice = ref(0.1);
const outputPrice = ref(5);
const batchDiscountPercent = ref(0);
const contextWindow = ref(128000);
const { t } = useI18n();
const tt = (key: string, fallback: string) => t(`tools.llm-token-cost-calculator.${key}`, fallback);

const estimate = computed(() => estimateTokens(prompt.value));
const uncachedInputTokens = computed(() => estimate.value.tokens * (100 - cachedInputPercent.value) / 100);
const cachedInputTokens = computed(() => estimate.value.tokens * cachedInputPercent.value / 100);
const discountMultiplier = computed(() => 1 - batchDiscountPercent.value / 100);

const costPerCall = computed(() => (
  costForMillionTokens(uncachedInputTokens.value, inputPrice.value)
  + costForMillionTokens(cachedInputTokens.value, cachedInputPrice.value)
  + costForMillionTokens(expectedOutputTokens.value, outputPrice.value)
) * discountMultiplier.value);

const monthlyCost = computed(() => costPerCall.value * callsPerDay.value * 30);
const contextUsage = computed(() => Math.min(100, (estimate.value.tokens + expectedOutputTokens.value) / contextWindow.value * 100));
const remainingContext = computed(() => Math.max(0, contextWindow.value - estimate.value.tokens - expectedOutputTokens.value));
</script>

<template>
  <div class="llm-root">
    <LlmUsageNote
      :what="tt('usage.what', '')"
      :steps="[tt('usage.step1', ''), tt('usage.step2', ''), tt('usage.step3', '')]"
      :tip="tt('usage.tip', '')"
    />

    <!-- ── Row 1: Prompt + Stats + Cost ── -->
    <div class="top-row">
      <!-- Prompt textarea -->
      <div class="panel prompt-panel">
        <div class="panel-head">
          <span class="dot dot-green" />
          <span class="panel-label">{{ tt('sections.promptPayload', 'Prompt payload') }}</span>
        </div>
        <n-input
          v-model:value="prompt"
          type="textarea"
          :autosize="{ minRows: 10, maxRows: 20 }"
          :placeholder="tt('placeholders.prompt', 'Paste a prompt, system message, tool schema, or RAG context...')"
        />
      </div>

      <!-- Right column: token stats + cost -->
      <div class="right-col">
        <!-- Token stats -->
        <div class="panel stats-panel">
          <div class="panel-head">
            <span class="dot dot-blue" />
            <span class="panel-label">{{ tt('sections.tokenEstimate', 'Token Estimate') }}</span>
          </div>
          <div class="stat-grid">
            <div class="stat-item primary">
              <span class="stat-label">{{ tt('metrics.inputTokens', 'Input tokens') }}</span>
              <span class="mono stat-value">{{ formatNumber(estimate.tokens) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">{{ tt('metrics.characters', 'Chars') }}</span>
              <span class="stat-value mono">{{ formatNumber(estimate.characters) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">{{ tt('metrics.words', 'Words') }}</span>
              <span class="stat-value mono">{{ formatNumber(estimate.words) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">{{ tt('metrics.cjkChars', 'CJK') }}</span>
              <span class="stat-value mono">{{ formatNumber(estimate.cjkCharacters) }}</span>
            </div>
          </div>
        </div>

        <!-- Cost result -->
        <div class="panel cost-panel">
          <div class="panel-head">
            <span class="dot dot-amber" />
            <span class="panel-label">{{ tt('sections.costResult', 'Cost Result') }}</span>
          </div>
          <div class="hero-block">
            <span class="hero-value mono">{{ formatMoney(costPerCall) }}</span>
            <span class="hero-sub">{{ tt('metrics.perCall', 'per call') }}</span>
          </div>
          <div class="cost-rows">
            <div class="cost-row">
              <span>{{ tt('metrics.runRate30d', '30-day run-rate') }}</span>
              <span class="mono">{{ formatMoney(monthlyCost) }}</span>
            </div>
            <div class="cost-row">
              <span>{{ tt('metrics.remainingContext', 'Remaining ctx') }}</span>
              <span class="mono">{{ formatNumber(remainingContext) }}</span>
            </div>
          </div>
          <div class="ctx-bar-wrap">
            <n-progress type="line" :percentage="contextUsage" :show-indicator="false" color="#22c55e" />
            <div class="ctx-bar-label">
              <span>{{ tt('metrics.contextUsage', 'Context') }}</span>
              <span class="mono">{{ contextUsage.toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Row 2: Controls ── -->
    <div class="panel controls-panel">
      <div class="panel-head">
        <span class="dot dot-slate" />
        <span class="panel-label">{{ tt('sections.parameters', 'Parameters') }}</span>
      </div>

      <div class="controls-grid">
        <!-- Col A: call params -->
        <div class="ctrl-group">
          <div class="ctrl-group-label">
            {{ tt('sections.callParams', 'Call params') }}
          </div>
          <div class="field-block">
            <label>{{ tt('fields.expectedOutputTokens', 'Output tokens') }}</label>
            <n-input-number v-model:value="expectedOutputTokens" :min="0" :step="100" w-full />
          </div>
          <div class="field-block">
            <label>{{ tt('fields.callsPerDay', 'Calls / day') }}</label>
            <n-input-number v-model:value="callsPerDay" :min="1" :step="10" w-full />
          </div>
          <div class="field-block">
            <label>{{ tt('fields.contextWindow', 'Context window') }}</label>
            <n-input-number v-model:value="contextWindow" :min="1000" :step="1000" w-full />
          </div>
        </div>

        <!-- Col B: cache + batch sliders -->
        <div class="ctrl-group">
          <div class="ctrl-group-label">
            {{ tt('sections.cacheAndBatch', 'Cache & batch') }}
          </div>
          <div class="field-block">
            <label>{{ tt('fields.cachedInputHit', 'Cached hit') }} <strong class="mono">{{ cachedInputPercent }}%</strong></label>
            <n-slider v-model:value="cachedInputPercent" :min="0" :max="100" :step="1" />
          </div>
          <div class="field-block" style="margin-top: 8px;">
            <label>{{ tt('fields.batchDiscount', 'Batch discount') }} <strong class="mono">{{ batchDiscountPercent }}%</strong></label>
            <n-slider v-model:value="batchDiscountPercent" :min="0" :max="90" :step="5" />
          </div>
        </div>

        <!-- Col C: pricing -->
        <div class="ctrl-group">
          <div class="ctrl-group-label">
            {{ tt('sections.pricing', 'Pricing ($ / 1M)') }}
          </div>
          <div class="field-block">
            <label>{{ tt('fields.inputPrice', 'Input') }}</label>
            <n-input-number v-model:value="inputPrice" :min="0" :step="0.1" w-full />
          </div>
          <div class="field-block">
            <label>{{ tt('fields.cachedInputPrice', 'Cached input') }}</label>
            <n-input-number v-model:value="cachedInputPrice" :min="0" :step="0.1" w-full />
          </div>
          <div class="field-block">
            <label>{{ tt('fields.outputPrice', 'Output') }}</label>
            <n-input-number v-model:value="outputPrice" :min="0" :step="0.1" w-full />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
/* ── Root ── */
.llm-root {
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-family: 'DM Sans', sans-serif;
}

/* ── Top row ── */
.top-row {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 14px;
  align-items: start;
}

.right-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ── Panel base ── */
.panel {
  padding: 18px 20px 20px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;

  .dark & {
    background: #161b22;
    border-color: #30363d;
  }
}

/* ── Panel header ── */
.panel-head {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 14px;
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
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-green { background: #22c55e; }
.dot-blue  { background: #3b82f6; }
.dot-amber { background: #f59e0b; }
.dot-slate { background: #64748b; }

/* ── Stats panel ── */
.stats-panel {
  border-top: 3px solid #3b82f6;
}

.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  .dark & { background: #30363d; }
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 12px;
  background: #fff;
  .dark & { background: #161b22; }

  &.primary {
    grid-column: span 2;
    background: #f0fdf4;
    .dark & { background: rgba(34,197,94,0.06); }

    .stat-value { font-size: 24px; color: #15803d; .dark & { color: #4ade80; } }
  }
}

.stat-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #9ca3af;
  .dark & { color: #6e7681; }
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  .dark & { color: #e6edf3; }
}

/* ── Cost panel ── */
.cost-panel {
  border-top: 3px solid #f59e0b;
}

.hero-block {
  margin-bottom: 14px;
}

.hero-value {
  display: block;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.1;
  color: #111827;
  .dark & { color: #e6edf3; }
}

.hero-sub {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9ca3af;
  .dark & { color: #6e7681; }
}

.cost-rows {
  margin-bottom: 12px;
}

.cost-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 7px 0;
  font-size: 13px;
  border-bottom: 1px solid #f0f0f0;
  color: #374151;
  .dark & { border-color: #21262d; color: #8b949e; }
}

.ctx-bar-wrap {
  margin-top: 4px;
}

.ctx-bar-label {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 11px;
  color: #9ca3af;
  .dark & { color: #6e7681; }
}

/* ── Controls panel ── */
.controls-panel {
  border-top: 3px solid #64748b;
}

.controls-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0 28px;
}

.ctrl-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 28px;
  border-right: 1px solid #f0f0f0;
  .dark & { border-color: #21262d; }

  &:last-child {
    border-right: none;
    padding-right: 0;
  }
}

.ctrl-group-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9ca3af;
  margin-bottom: 2px;
  .dark & { color: #6e7681; }
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

.mono {
  font-family: 'Space Mono', monospace;
  font-weight: 700;
}

/* ── Responsive ── */
@media (max-width: 860px) {
  .top-row {
    grid-template-columns: 1fr;
  }

  .controls-grid {
    grid-template-columns: 1fr 1fr;
  }

  .ctrl-group:nth-child(2) {
    border-right: none;
    padding-right: 0;
  }

  .ctrl-group:last-child {
    grid-column: span 2;
    border-top: 1px solid #f0f0f0;
    padding-top: 14px;
    .dark & { border-color: #21262d; }
  }
}

@media (max-width: 520px) {
  .controls-grid {
    grid-template-columns: 1fr;
  }

  .ctrl-group {
    border-right: none;
    padding-right: 0;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 14px;
    .dark & { border-color: #21262d; }

    &:last-child { border-bottom: none; padding-bottom: 0; }
  }

  .ctrl-group:last-child {
    grid-column: span 1;
  }
}
</style>
