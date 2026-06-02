<script setup lang="ts">
import { buildNestedSamplePayload } from './prompt-variable-extractor.service';
import { useCopy } from '@/composable/copy';

const { t } = useI18n();
const tt = (key: string, fallback: string) => t(`tools.prompt-variable-extractor.${key}`, fallback);

const template = ref(`Role: {{role}}
Task: Draft a launch update for {{product.name}} in {{language}}.
Audience: {{audience.segment}}
Constraints:
- Keep under {{constraints.max_words}} words
- Include CTA: {{cta}}
- Mention release date: {{timeline.release_date}}`);

const variables = computed(() => {
  const pattern = /{{\s*([A-Za-z_][A-Za-z0-9_.-]*)\s*}}/g;
  const found = new Set<string>();
  let match: RegExpExecArray | null = null;

  do {
    match = pattern.exec(template.value);
    if (match?.[1]) {
      found.add(match[1]);
    }
  } while (match);

  return [...found].sort((a, b) => a.localeCompare(b));
});

const jsonExample = computed(() => {
  return JSON.stringify(buildNestedSamplePayload(variables.value), null, 2);
});

const variablesPlainText = computed(() => variables.value.join('\n'));

const { copy: copyVariables } = useCopy({
  source: variablesPlainText,
  text: tt('messages.variablesCopied', 'Variables copied to the clipboard'),
});

const { copy: copyJson } = useCopy({
  source: jsonExample,
  text: tt('messages.jsonCopied', 'JSON copied to the clipboard'),
});
</script>

<template>
  <div class="extractor-root">
    <!-- Row 1: template left · variables right -->
    <div class="top-row">
      <!-- Template input -->
      <div class="template-panel panel">
        <div class="panel-head">
          <span class="dot dot-orange" />
          <span class="panel-label">{{ tt('sections.input', 'Prompt Template') }}</span>
        </div>
        <c-input-text
          v-model:value="template"

          rows="12"
          raw-text multiline
          :placeholder="tt('placeholders.template', 'Paste your prompt with {{double.curly}} placeholders...')"
        />
      </div>

      <!-- Detected variables -->
      <div class="panel vars-panel">
        <div class="panel-head">
          <span class="dot dot-violet" />
          <span class="panel-label">{{ tt('sections.variables', 'Detected Variables') }}</span>
          <span class="mono var-count">{{ variables.length }}</span>
        </div>

        <div v-if="variables.length === 0" class="empty-state">
          <span class="empty-icon">∅</span>
          <span>{{ tt('messages.noVariables', 'No placeholders found') }}</span>
        </div>

        <div v-else class="chip-cloud">
          <span v-for="variable in variables" :key="variable" class="var-chip">
            {{ variable }}
          </span>
        </div>

        <div class="panel-actions">
          <c-button :disabled="variables.length === 0" @click="copyVariables()">
            {{ tt('actions.copyVariables', 'Copy list') }}
          </c-button>
        </div>
      </div>
    </div>

    <!-- Row 2: JSON payload -->
    <div class="panel json-panel">
      <div class="panel-head">
        <span class="dot dot-teal" />
        <span class="panel-label">{{ tt('sections.json', 'JSON Example Payload') }}</span>
      </div>
      <c-input-text
        :value="jsonExample"
        multiline
        rows="8"
        raw-text
        readonly
      />
      <div class="panel-actions">
        <c-button :disabled="variables.length === 0" @click="copyJson()">
          {{ tt('actions.copyJson', 'Copy JSON') }}
        </c-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.extractor-root {
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

/* Panel */
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

/* Template panel */
.template-panel { border-top: 3px solid #f97316; }

/* Variables panel */
.vars-panel { border-top: 3px solid #8b5cf6; }

.var-count {
  font-size: 20px;
  font-weight: 700;
  color: #8b5cf6;
  line-height: 1;
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

.chip-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-bottom: 14px;
}

.var-chip {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px 9px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Space Mono', monospace;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.25);
  color: #7c3aed;
  .dark & {
    background: rgba(139, 92, 246, 0.12);
    border-color: rgba(139, 92, 246, 0.3);
    color: #a78bfa;
  }
}

/* JSON panel */
.json-panel { border-top: 3px solid #14b8a6; }

.panel-actions {
  margin-top: 12px;
}

.mono {
  font-family: 'Space Mono', monospace;
  font-weight: 700;
}

@media (max-width: 860px) {
  .top-row { grid-template-columns: 1fr; }
}
</style>
