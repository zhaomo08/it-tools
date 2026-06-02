<script setup lang="ts">
import { costForMillionTokens, formatBytes, formatMoney, formatNumber } from '../llm-shared/calculators';

const { t } = useI18n();
const tt = (key: string, fallback: string) => t(`tools.kv-cache-calculator.${key}`, fallback);

const presets = computed(() => ([
  { label: tt('options.presets.custom', 'Custom transformer'), value: 'custom', layers: 32, kvHeads: 8, headDim: 128 },
  { label: tt('options.presets.llama8b', 'Llama-style 8B GQA'), value: 'llama8b', layers: 32, kvHeads: 8, headDim: 128 },
  { label: tt('options.presets.llama70b', 'Llama-style 70B GQA'), value: 'llama70b', layers: 80, kvHeads: 8, headDim: 128 },
  { label: tt('options.presets.dense32', 'Dense 32 heads x 128'), value: 'dense32', layers: 32, kvHeads: 32, headDim: 128 },
]));

const precisionOptions = computed(() => ([
  { label: tt('options.precision.fp16', 'FP16 / BF16 (2 bytes)'), value: 2 },
  { label: tt('options.precision.fp8', 'FP8 / INT8 (1 byte)'), value: 1 },
  { label: tt('options.precision.int4', 'INT4 / FP4 (0.5 byte)'), value: 0.5 },
]));

const preset = ref('llama8b');
const tokens = ref(128000);
const sequences = ref(1);
const layers = ref(32);
const kvHeads = ref(8);
const headDim = ref(128);
const precisionBytes = ref(2);

const requests = ref(1000);
const sharedPrefixTokens = ref(24000);
const variableTokens = ref(2000);
const outputTokens = ref(1000);
const cacheHitPercent = ref(75);
const inputPrice = ref(1);
const cachedInputPrice = ref(0.1);
const outputPrice = ref(5);

watch(preset, (value) => {
  const next = presets.value.find(item => item.value === value);
  if (!next) {
    return;
  }
  layers.value = next.layers;
  kvHeads.value = next.kvHeads;
  headDim.value = next.headDim;
}, { immediate: true });

const perTokenBytes = computed(() => layers.value * kvHeads.value * headDim.value * 2 * precisionBytes.value);
const kvCacheBytes = computed(() => perTokenBytes.value * tokens.value * sequences.value);
const maxTokensIn24GiB = computed(() => Math.floor(24 * 1024 ** 3 / Math.max(1, perTokenBytes.value * sequences.value)));

const noCacheTokens = computed(() => requests.value * (sharedPrefixTokens.value + variableTokens.value));
const cachedTokens = computed(() => Math.max(0, requests.value - 1) * sharedPrefixTokens.value * cacheHitPercent.value / 100);
const uncachedInputTokens = computed(() => noCacheTokens.value - cachedTokens.value);
const cacheCost = computed(() =>
  costForMillionTokens(uncachedInputTokens.value, inputPrice.value)
  + costForMillionTokens(cachedTokens.value, cachedInputPrice.value)
  + costForMillionTokens(requests.value * outputTokens.value, outputPrice.value),
);
const noCacheCost = computed(() =>
  costForMillionTokens(noCacheTokens.value, inputPrice.value)
  + costForMillionTokens(requests.value * outputTokens.value, outputPrice.value),
);
const savings = computed(() => Math.max(0, noCacheCost.value - cacheCost.value));
</script>

<template>
  <div class="kv-root">
    <!-- ── Row 1: KV Memory config + result ── -->
    <div class="top-row row">
      <!-- Left: inputs -->
      <div class="panel config-panel">
        <div class="panel-head">
          <span class="dot dot-blue" />
          <span class="panel-label">{{ tt('sections.kvMemory', 'KV Memory') }}</span>
        </div>

        <div class="field-grid">
          <div class="field-block span2">
            <label>{{ tt('fields.modelPreset', 'Model preset') }}</label>
            <c-select v-model:value="preset" :options="presets" w-full />
          </div>

          <div class="field-block">
            <label>{{ tt('fields.tokensPerSequence', 'Tokens / seq') }}</label>
            <n-input-number v-model:value="tokens" :min="1" :step="1024" w-full />
          </div>

          <div class="field-block">
            <label>{{ tt('fields.concurrentSequences', 'Concurrent seqs') }}</label>
            <n-input-number v-model:value="sequences" :min="1" :step="1" w-full />
          </div>

          <div class="field-block span2">
            <label>{{ tt('fields.kvPrecision', 'KV precision') }}</label>
            <c-select v-model:value="precisionBytes" :options="precisionOptions" w-full />
          </div>
        </div>

        <!-- Arch params -->
        <div class="arch-row">
          <div class="arch-item">
            <span class="arch-label">{{ tt('fields.layers', 'Layers') }}</span>
            <n-input-number v-model:value="layers" :min="1" w-full size="small" />
          </div>
          <div class="arch-sep">
            ×
          </div>
          <div class="arch-item">
            <span class="arch-label">{{ tt('fields.kvHeads', 'KV heads') }}</span>
            <n-input-number v-model:value="kvHeads" :min="1" w-full size="small" />
          </div>
          <div class="arch-sep">
            ×
          </div>
          <div class="arch-item">
            <span class="arch-label">{{ tt('fields.headDim', 'Head dim') }}</span>
            <n-input-number v-model:value="headDim" :min="1" w-full size="small" />
          </div>
        </div>
      </div>

      <!-- Right: result -->
      <div class="panel result-panel">
        <div class="panel-head">
          <span class="dot dot-cyan" />
          <span class="panel-label">{{ tt('sections.result', 'Result') }}</span>
        </div>

        <div class="hero-block">
          <span class="hero-value">{{ formatBytes(kvCacheBytes).split(' ')[0] }}</span>
          <span class="hero-unit">{{ formatBytes(kvCacheBytes).split(' ')[1] }}</span>
          <div class="hero-sub">
            {{ tt('metrics.totalKvCache', 'Total KV Cache') }}
          </div>
        </div>

        <div class="metrics-table">
          <div class="metric-row">
            <span>{{ tt('metrics.perToken', 'Per token') }}</span>
            <span class="mono">{{ formatBytes(perTokenBytes) }}</span>
          </div>
          <div class="metric-row accent">
            <span>{{ tt('metrics.tokenBudget24', '24 GiB token budget') }}</span>
            <span class="mono">{{ formatNumber(maxTokensIn24GiB) }}</span>
          </div>
        </div>

        <div class="formula-block">
          <span class="formula-term">layers</span>
          <span class="formula-op">×</span>
          <span class="formula-term">kv heads</span>
          <span class="formula-op">×</span>
          <span class="formula-term">head dim</span>
          <span class="formula-op">×</span>
          <span class="formula-term">K/V</span>
          <span class="formula-op">×</span>
          <span class="formula-term">precision</span>
          <span class="formula-op">×</span>
          <span class="formula-term">tokens</span>
          <span class="formula-op">×</span>
          <span class="formula-term">seqs</span>
        </div>
      </div>
    </div>

    <!-- ── Row 2: Cache economics ── -->
    <div class="panel cache-panel">
      <div class="panel-head">
        <span class="dot dot-green" />
        <span class="panel-label">{{ tt('sections.cacheEconomics', 'Prefix Cache Economics') }}</span>
      </div>

      <div class="cache-grid">
        <div class="field-block">
          <label>{{ tt('fields.requests', 'Requests') }}</label>
          <n-input-number v-model:value="requests" :min="1" :step="100" w-full />
        </div>
        <div class="field-block">
          <label>{{ tt('fields.sharedPrefixTokens', 'Shared prefix tokens') }}</label>
          <n-input-number v-model:value="sharedPrefixTokens" :min="0" :step="1000" w-full />
        </div>
        <div class="field-block">
          <label>{{ tt('fields.variableInputTokens', 'Variable input tokens') }}</label>
          <n-input-number v-model:value="variableTokens" :min="0" :step="100" w-full />
        </div>
        <div class="field-block">
          <label>{{ tt('fields.outputTokens', 'Output tokens') }}</label>
          <n-input-number v-model:value="outputTokens" :min="0" :step="100" w-full />
        </div>

        <div class="field-block span4">
          <label>{{ tt('fields.cacheHit', 'Cache hit rate') }} — <strong class="mono">{{ cacheHitPercent }}%</strong></label>
          <n-slider v-model:value="cacheHitPercent" :min="0" :max="100" />
        </div>

        <div class="field-block">
          <label>{{ tt('fields.inputPrice', 'Input $\u202f/\u202f1M') }}</label>
          <n-input-number v-model:value="inputPrice" :min="0" :step="0.1" w-full />
        </div>
        <div class="field-block">
          <label>{{ tt('fields.cachedPrice', 'Cached $\u202f/\u202f1M') }}</label>
          <n-input-number v-model:value="cachedInputPrice" :min="0" :step="0.1" w-full />
        </div>
        <div class="field-block">
          <label>{{ tt('fields.outputPrice', 'Output $\u202f/\u202f1M') }}</label>
          <n-input-number v-model:value="outputPrice" :min="0" :step="0.1" w-full />
        </div>
      </div>

      <!-- Result strip -->
      <div class="strip">
        <div class="strip-item">
          <span class="strip-label">{{ tt('metrics.cachedTokens', 'Cached tokens') }}</span>
          <span class="mono strip-value">{{ formatNumber(cachedTokens) }}</span>
        </div>
        <div class="strip-divider" />
        <div class="strip-item">
          <span class="strip-label">{{ tt('metrics.withCache', 'Cost with cache') }}</span>
          <span class="strip-value mono">{{ formatMoney(cacheCost) }}</span>
        </div>
        <div class="strip-divider" />
        <div class="strip-item highlight">
          <span class="strip-label">{{ tt('metrics.savings', 'Savings') }}</span>
          <span class="strip-value mono">{{ formatMoney(savings) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
/* ── Root layout ── */
.kv-root {
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-family: 'DM Sans', sans-serif;
}

.top-row {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 14px;
  align-items: start;
}

/* ── Panel base ── */
.panel {
  padding: 20px 22px 22px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  transition: box-shadow 0.15s;

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
  margin-bottom: 18px;
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
.dot-blue  { background: #3b82f6; }
.dot-cyan  { background: #06b6d4; }
.dot-green { background: #22c55e; }

/* ── Field grid ── */
.field-grid {
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

/* ── Arch row (Layers × KV heads × Head dim) ── */
.arch-row {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  padding-top: 4px;
  border-top: 1px solid #f0f0f0;
  .dark & { border-color: #21262d; }
}

.arch-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.arch-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #9ca3af;
  .dark & { color: #6e7681; }
}

.arch-sep {
  font-size: 16px;
  font-weight: 300;
  color: #cbd5e1;
  padding-bottom: 6px;
  flex-shrink: 0;
  .dark & { color: #30363d; }
}

/* ── Result panel ── */
.result-panel {
  border-top: 3px solid #06b6d4;
}

.hero-block {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 20px;
}

.hero-value {
  font-family: 'Space Mono', monospace;
  font-size: 46px;
  font-weight: 700;
  line-height: 1;
  color: #0f172a;
  .dark & { color: #e6edf3; }
}

.hero-unit {
  font-family: 'Space Mono', monospace;
  font-size: 20px;
  font-weight: 400;
  color: #06b6d4;
}

.hero-sub {
  width: 100%;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #9ca3af;
  margin-top: 2px;
  .dark & { color: #6e7681; }
}

/* ── Metrics table ── */
.metrics-table {
  margin-bottom: 18px;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 13px;
  border-bottom: 1px solid #f0f0f0;
  gap: 12px;
  color: #374151;
  .dark & {
    border-color: #21262d;
    color: #8b949e;
  }

  &.accent {
    color: #0369a1;
    .dark & { color: #7dd3fc; }
  }
}

.mono {
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  font-weight: 700;
  color: #111827;
  .dark & { color: #e6edf3; }
}

/* ── Formula ── */
.formula-block {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 3px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f8fafc;
  .dark & { background: #0d1117; }
}

.formula-term {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  color: #64748b;
  .dark & { color: #6e7681; }
}

.formula-op {
  font-size: 10px;
  color: #06b6d4;
  padding: 0 1px;
}

/* ── Cache panel ── */
.cache-panel {
  border-top: 3px solid #22c55e;
}

.cache-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px 14px;
  margin-bottom: 18px;
}

.span4 { grid-column: span 4; }

/* ── Result strip ── */
.strip {
  display: flex;
  align-items: stretch;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  .dark & { border-color: #30363d; }
}

.strip-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 14px 18px;

  &.highlight {
    background: linear-gradient(135deg, rgba(34,197,94,0.07) 0%, rgba(34,197,94,0.03) 100%);
    .dark & { background: rgba(34,197,94,0.08); }

    .strip-value { color: #16a34a; .dark & { color: #4ade80; } }
  }
}

.strip-divider {
  width: 1px;
  background: #e5e7eb;
  .dark & { background: #30363d; }
}

.strip-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #9ca3af;
  .dark & { color: #6e7681; }
}

.strip-value {
  font-family: 'Space Mono', monospace;
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  .dark & { color: #e6edf3; }
}

/* ── Responsive ── */
@media (max-width: 860px) {
  .top-row {
    grid-template-columns: 1fr;
  }

  .cache-grid {
    grid-template-columns: 1fr 1fr;
  }

  .span4 { grid-column: span 2; }

  .strip {
    flex-direction: column;
  }

  .strip-divider {
    width: 100%;
    height: 1px;
  }
}

@media (max-width: 520px) {
  .field-grid {
    grid-template-columns: 1fr;
  }

  .span2 { grid-column: span 1; }

  .cache-grid {
    grid-template-columns: 1fr;
  }

  .span4 { grid-column: span 1; }

  .arch-row {
    flex-direction: column;
    align-items: stretch;
  }

  .arch-sep { display: none; }
}
</style>
