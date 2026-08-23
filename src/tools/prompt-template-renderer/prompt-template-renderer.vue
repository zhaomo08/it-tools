<script setup lang="ts">
import LlmUsageNote from '../llm-shared/llm-usage-note.vue';
import { useCopy } from '@/composable/copy';

const { t } = useI18n();
const tt = (key: string, fallback: string) => t(`tools.prompt-template-renderer.${key}`, fallback);

const template = ref(`You are a {{assistant.role}} for {{company.name}}.
Goal: {{task.goal}}
Audience: {{audience.segment}}
Return language: {{output.language}}
Key points:
- {{task.point1}}
- {{task.point2}}
CTA: {{cta.text}}`);
const variablesJson = ref(`{
  "assistant": { "role": "customer success assistant" },
  "company": { "name": "Acme Cloud" },
  "task": {
    "goal": "announce the new analytics dashboard",
    "point1": "real-time KPI overview",
    "point2": "custom alerts"
  },
  "audience": { "segment": "startup founders" },
  "output": { "language": "English" },
  "cta": { "text": "Book a 15-minute demo" }
}`);

function getByPath(data: unknown, path: string): unknown {
  return path.split('.').reduce((current, part) => {
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[part];
    }

    return undefined;
  }, data as unknown);
}

const parsedVariables = computed(() => {
  try {
    const parsed = JSON.parse(variablesJson.value);
    return { isValid: true as const, value: parsed, error: '' };
  }
  catch (error) {
    return {
      isValid: false as const,
      value: {},
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

const matches = computed(() => [...template.value.matchAll(/{{\s*([A-Za-z_][A-Za-z0-9_.-]*)\s*}}/g)]);

const placeholders = computed(() => {
  const names = matches.value.map(match => match[1]).filter(Boolean) as string[];
  return [...new Set(names)].sort((a, b) => a.localeCompare(b));
});

const unresolvedKeys = computed(() => {
  if (!parsedVariables.value.isValid) {
    return placeholders.value;
  }

  return placeholders.value.filter(key => typeof getByPath(parsedVariables.value.value, key) === 'undefined');
});

const renderedPrompt = computed(() => {
  if (!parsedVariables.value.isValid) {
    return '';
  }

  return template.value.replace(/{{\s*([A-Za-z_][A-Za-z0-9_.-]*)\s*}}/g, (_full, key: string) => {
    const value = getByPath(parsedVariables.value.value, key);

    if (typeof value === 'undefined') {
      return `{{${key}}}`;
    }

    if (typeof value === 'string') {
      return value;
    }

    return JSON.stringify(value);
  });
});

const { copy: copyRendered } = useCopy({
  source: renderedPrompt,
  text: tt('messages.renderedCopied', 'Rendered prompt copied to clipboard'),
});
</script>

<template>
  <div class="renderer-root">
    <LlmUsageNote
      :what="tt('usage.what', '')"
      :steps="[tt('usage.step1', ''), tt('usage.step2', ''), tt('usage.step3', '')]"
      :tip="tt('usage.tip', '')"
    />

    <!-- Row 1: Template + Variables side by side -->
    <div class="top-row">
      <div class="panel template-panel">
        <div class="panel-head">
          <span class="dot dot-indigo" />
          <span class="panel-label">{{ tt('sections.template', 'Prompt Template') }}</span>
        </div>
        <c-input-text
          v-model:value="template"
          multiline
          rows="10"
          raw-text
          :placeholder="tt('placeholders.template', 'Use {{path.to.value}} placeholders...')"
        />
      </div>

      <div class="panel vars-panel">
        <div class="panel-head">
          <span class="dot dot-cyan" />
          <span class="panel-label">{{ tt('sections.variables', 'Variables JSON') }}</span>
        </div>
        <c-input-text
          v-model:value="variablesJson"
          multiline
          rows="10"
          raw-text
          :placeholder="tt('placeholders.variablesJson', 'Paste JSON object here...')"
        />
        <n-alert v-if="!parsedVariables.isValid" type="error" mt-10px size="small">
          {{ tt('messages.invalidJson', 'Invalid JSON:') }} {{ parsedVariables.error }}
        </n-alert>
      </div>
    </div>

    <!-- Row 2: Rendered result -->
    <div class="panel result-panel">
      <div class="panel-head">
        <span class="dot dot-green" />
        <span class="panel-label">{{ tt('sections.result', 'Rendered Result') }}</span>

        <!-- Inline stats -->
        <div class="stat-pills">
          <span class="stat-pill">
            <span class="mono stat-n">{{ placeholders.length }}</span>
            <span class="stat-l">{{ tt('metrics.detected', 'detected') }}</span>
          </span>
          <span class="stat-sep">·</span>
          <span class="stat-pill" :class="{ 'pill-warn': unresolvedKeys.length > 0 }">
            <span class="stat-n mono">{{ unresolvedKeys.length }}</span>
            <span class="stat-l">{{ tt('metrics.unresolved', 'unresolved') }}</span>
          </span>
        </div>
      </div>

      <!-- Unresolved key chips -->
      <div v-if="unresolvedKeys.length > 0" class="unresolved-row">
        <span class="unresolved-label">{{ tt('metrics.unresolved', 'Unresolved') }}:</span>
        <span v-for="key in unresolvedKeys" :key="key" class="warn-chip">{{ key }}</span>
      </div>

      <c-input-text
        :value="renderedPrompt"
        multiline
        rows="9"
        raw-text
        readonly
      />

      <div class="panel-actions">
        <c-button :disabled="!renderedPrompt" @click="copyRendered()">
          {{ tt('actions.copyRendered', 'Copy rendered prompt') }}
        </c-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.renderer-root {
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

/* Panel base */
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
.dot-indigo { background: #6366f1; }
.dot-cyan   { background: #06b6d4; }
.dot-green  { background: #22c55e; }

/* Panel accents */
.template-panel { border-top: 3px solid #6366f1; }
.vars-panel     { border-top: 3px solid #06b6d4; }
.result-panel   { border-top: 3px solid #22c55e; }

/* Stats pills */
.stat-pills {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}

.stat-pill {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 12px;
}

.stat-n {
  font-size: 15px;
  font-weight: 700;
  color: #22c55e;
  .dark & { color: #4ade80; }
}

.stat-l {
  color: #9ca3af;
  .dark & { color: #6e7681; }
}

.pill-warn .stat-n {
  color: #f59e0b;
  .dark & { color: #fbbf24; }
}

.stat-sep {
  color: #d1d5db;
  .dark & { color: #30363d; }
}

/* Unresolved chips row */
.unresolved-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  margin-bottom: 12px;
}

.unresolved-label {
  font-size: 11px;
  font-weight: 600;
  color: #92400e;
  .dark & { color: #fbbf24; }
}

.warn-chip {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Space Mono', monospace;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #b45309;
  .dark & { color: #fbbf24; }
}

.panel-actions {
  margin-top: 12px;
}

.mono {
  font-family: 'Space Mono', monospace;
}

@media (max-width: 860px) {
  .top-row { grid-template-columns: 1fr; }
  .stat-pills { margin-left: 0; }
}
</style>
