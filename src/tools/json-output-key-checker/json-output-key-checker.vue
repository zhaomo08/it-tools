<script setup lang="ts">
import { formatNumber } from '../llm-shared/calculators';

const { t } = useI18n();
const tt = (key: string, fallback: string) => t(`tools.json-output-key-checker.${key}`, fallback);

const requiredKeysInput = ref(`title
summary
priority
owner
action_items`);
const outputJson = ref(`{
  "title": "Release readiness review",
  "summary": "QA blockers cleared, docs still pending.",
  "priority": "high",
  "owner": "ops-team",
  "next_sync": "2026-06-02"
}`);

const requiredKeys = computed(() =>
  requiredKeysInput.value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean),
);

const parsedOutput = computed(() => {
  try {
    const parsed = JSON.parse(outputJson.value);
    const isObject = parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed);

    return {
      isValid: isObject,
      value: isObject ? parsed as Record<string, unknown> : {},
      error: isObject ? '' : tt('messages.notObject', 'JSON value must be an object.'),
    };
  }
  catch (error) {
    return {
      isValid: false,
      value: {},
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

const missingKeys = computed(() => {
  if (!parsedOutput.value.isValid) {
    return requiredKeys.value;
  }

  return requiredKeys.value.filter(key => !(key in parsedOutput.value.value));
});

const extraKeys = computed(() => {
  if (!parsedOutput.value.isValid) {
    return [] as string[];
  }

  const required = new Set(requiredKeys.value);
  return Object.keys(parsedOutput.value.value).filter(key => !required.has(key));
});

const status = computed(() => {
  if (!parsedOutput.value.isValid) {
    return tt('status.invalidJson', 'Invalid JSON');
  }

  if (missingKeys.value.length === 0) {
    return tt('status.passed', 'Passed');
  }

  return tt('status.failed', 'Missing required keys');
});
</script>

<template>
  <div class="checker-root">
    <!-- Row 1: Required keys · JSON output -->
    <div class="top-row">
      <div class="keys-panel panel">
        <div class="panel-head">
          <span class="dot dot-violet" />
          <span class="panel-label">{{ tt('sections.requiredKeys', 'Required Keys') }}</span>
          <span class="count-badge mono">{{ requiredKeys.length }}</span>
        </div>
        <c-input-text
          v-model:value="requiredKeysInput"
          multiline
          rows="10"
          raw-text
        />
      </div>

      <div class="panel json-panel">
        <div class="panel-head">
          <span class="dot dot-sky" />
          <span class="panel-label">{{ tt('sections.outputJson', 'Model JSON Output') }}</span>
        </div>
        <c-input-text
          v-model:value="outputJson"
          multiline
          rows="10"
          raw-text
        />
        <n-alert v-if="!parsedOutput.isValid" type="error" mt-10px size="small">
          {{ tt('messages.invalidJson', 'Invalid JSON:') }} {{ parsedOutput.error }}
        </n-alert>
      </div>
    </div>

    <!-- Row 2: Result -->
    <div class="panel result-panel">
      <div class="panel-head">
        <!-- Status badge -->
        <span
          class="status-badge"
          :class="{
            'badge-ok': missingKeys.length === 0 && parsedOutput.isValid,
            'badge-danger': missingKeys.length > 0 || !parsedOutput.isValid,
          }"
        >
          <span class="badge-icon">{{ missingKeys.length === 0 && parsedOutput.isValid ? '✓' : '✕' }}</span>
          <span class="badge-text">{{ status }}</span>
        </span>

        <!-- Metrics strip -->
        <div class="metrics-strip">
          <div class="metric">
            <span class="mono metric-n">{{ formatNumber(requiredKeys.length) }}</span>
            <span class="metric-l">{{ tt('metrics.requiredCount', 'required') }}</span>
          </div>
          <div class="metric-div" />
          <div class="metric">
            <span class="metric-n mono" :class="{ 'c-danger': missingKeys.length > 0 }">{{ formatNumber(missingKeys.length) }}</span>
            <span class="metric-l">{{ tt('metrics.missingCount', 'missing') }}</span>
          </div>
          <div class="metric-div" />
          <div class="metric">
            <span class="metric-n mono" :class="{ 'c-amber': extraKeys.length > 0 }">{{ formatNumber(extraKeys.length) }}</span>
            <span class="metric-l">{{ tt('metrics.extraCount', 'extra') }}</span>
          </div>
        </div>
      </div>

      <!-- Key chips 2-col -->
      <div class="key-lists">
        <div class="key-list">
          <div class="danger-label list-label">
            {{ tt('sections.missingKeys', 'Missing') }}
          </div>
          <div class="chip-cloud">
            <span v-for="key in missingKeys" :key="key" class="key-chip chip-danger">{{ key }}</span>
            <span v-if="missingKeys.length === 0" class="chip-none">{{ tt('messages.none', 'none') }}</span>
          </div>
        </div>
        <div class="key-list">
          <div class="list-label amber-label">
            {{ tt('sections.extraKeys', 'Extra') }}
          </div>
          <div class="chip-cloud">
            <span v-for="key in extraKeys" :key="key" class="key-chip chip-amber">{{ key }}</span>
            <span v-if="extraKeys.length === 0" class="chip-none">{{ tt('messages.none', 'none') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.checker-root {
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
  gap: 8px;
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
.dot-violet { background: #8b5cf6; }
.dot-sky    { background: #0ea5e9; }

.keys-panel { border-top: 3px solid #8b5cf6; }
.json-panel { border-top: 3px solid #0ea5e9; }
.result-panel { border-top: 3px solid #22c55e; }

.count-badge {
  font-size: 18px;
  font-weight: 700;
  color: #8b5cf6;
  line-height: 1;
}

/* Status badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 12px 6px 6px;
  border-radius: 999px;

  &.badge-ok {
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.25);
    .badge-icon { background: #22c55e; }
    .badge-text { color: #15803d; .dark & { color: #4ade80; } }
  }

  &.badge-danger {
    background: rgba(220, 38, 38, 0.08);
    border: 1px solid rgba(220, 38, 38, 0.2);
    .badge-icon { background: #dc2626; }
    .badge-text { color: #991b1b; .dark & { color: #f87171; } }
  }
}

.badge-icon {
  width: 22px; height: 22px;
  border-radius: 50%;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.badge-text {
  font-size: 14px;
  font-weight: 700;
}

/* Metrics strip */
.metrics-strip {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.metric-n {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  line-height: 1;
  .dark & { color: #e6edf3; }
}

.metric-l {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9ca3af;
  .dark & { color: #6e7681; }
}

.metric-div {
  width: 1px;
  height: 28px;
  background: #e5e7eb;
  .dark & { background: #30363d; }
}

.c-danger { color: #dc2626 !important; }
.c-amber  { color: #f59e0b !important; }

/* Key lists */
.key-lists {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.key-list {
  padding: 12px;
  border-radius: 10px;
  background: #f9fafb;
  border: 1px solid #f0f0f0;
  .dark & { background: #0d1117; border-color: #21262d; }
}

.list-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.danger-label { color: #dc2626; }
.amber-label  { color: #d97706; }

.chip-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.key-chip {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Space Mono', monospace;
}

.chip-danger {
  background: rgba(220, 38, 38, 0.1);
  border: 1px solid rgba(220, 38, 38, 0.25);
  color: #b91c1c;
  .dark & { color: #f87171; background: rgba(220,38,38,0.1); }
}

.chip-amber {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
  color: #92400e;
  .dark & { color: #fbbf24; background: rgba(245,158,11,0.1); }
}

.chip-none {
  font-size: 12px;
  color: #9ca3af;
  font-style: italic;
  .dark & { color: #6e7681; }
}

.mono {
  font-family: 'Space Mono', monospace;
  font-weight: 700;
}

@media (max-width: 860px) {
  .top-row { grid-template-columns: 1fr; }
  .metrics-strip { margin-left: 0; }
  .key-lists { grid-template-columns: 1fr; }
}
</style>
