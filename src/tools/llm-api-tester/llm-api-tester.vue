<script setup lang="ts">
import { buildChatCompletionsUrl, buildCurlCommand, buildRequestBody, summarizeChatCompletion } from './llm-api-tester.service';
import { useCopy } from '@/composable/copy';

const { t } = useI18n();
const tt = (key: string, fallback: string) => t(`tools.llm-api-tester.${key}`, fallback);

const baseUrl = ref('https://api.openai.com/v1');
const apiKey = ref('');
const model = ref('gpt-4o-mini');
const message = ref('你好');

const isLoading = ref(false);
const resultStatus = ref<'idle' | 'success' | 'error'>('idle');
const statusCode = ref<number | null>(null);
const latencyMs = ref<number | null>(null);
const responseText = ref('');
const errorMessage = ref('');
const rawResponse = ref('');

const canSend = computed(() => baseUrl.value.trim() && apiKey.value.trim() && model.value.trim() && message.value.trim());
const endpoint = computed(() => (baseUrl.value.trim() ? buildChatCompletionsUrl(baseUrl.value) : ''));
const curlCommand = computed(() => buildCurlCommand({
  baseUrl: baseUrl.value,
  apiKey: apiKey.value,
  model: model.value,
  message: message.value,
}));

const resultType = computed(() => {
  if (resultStatus.value === 'success') {
    return 'success';
  }
  if (resultStatus.value === 'error') {
    return 'error';
  }

  return 'info';
});

const statusLabel = computed(() => {
  if (resultStatus.value === 'success') {
    return tt('status.success', 'Configuration OK');
  }
  if (resultStatus.value === 'error') {
    return tt('status.error', 'Configuration failed');
  }

  return tt('status.idle', 'Ready to test');
});

const { copy: copyCurl } = useCopy({
  source: curlCommand,
  text: tt('messages.curlCopied', 'curl copied to clipboard'),
});

async function runTest() {
  if (!canSend.value) {
    resultStatus.value = 'error';
    errorMessage.value = tt('messages.missingFields', 'Base URL, API key, model, and message are required.');
    return;
  }

  isLoading.value = true;
  resultStatus.value = 'idle';
  statusCode.value = null;
  latencyMs.value = null;
  responseText.value = '';
  errorMessage.value = '';
  rawResponse.value = '';

  const startedAt = performance.now();

  try {
    const response = await fetch(endpoint.value, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.value.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildRequestBody({
        model: model.value,
        message: message.value,
      })),
    });

    latencyMs.value = Math.round(performance.now() - startedAt);
    statusCode.value = response.status;

    const text = await response.text();

    try {
      const json = JSON.parse(text);
      rawResponse.value = JSON.stringify(json, null, 2);

      if (!response.ok) {
        const apiMessage = json?.error?.message || json?.message || response.statusText;
        throw new Error(String(apiMessage));
      }

      const summary = summarizeChatCompletion(json);
      responseText.value = summary.content || tt('messages.noAssistantMessage', 'No assistant message was found in the response.');
      resultStatus.value = 'success';
    }
    catch (error) {
      if (!response.ok) {
        rawResponse.value = text || rawResponse.value;
        throw error;
      }

      rawResponse.value = text;
      throw new Error(tt('messages.invalidJson', 'The response is not valid JSON.'));
    }
  }
  catch (error) {
    latencyMs.value = latencyMs.value ?? Math.round(performance.now() - startedAt);
    resultStatus.value = 'error';
    errorMessage.value = error instanceof Error ? error.message : String(error);
  }
  finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="tester-root">
    <div class="top-row">
      <div class="panel config-panel">
        <div class="panel-head">
          <span class="dot dot-blue" />
          <span class="panel-label">{{ tt('sections.connection', 'Connection') }}</span>
        </div>

        <div class="field-block">
          <label>{{ tt('fields.baseUrl', 'Base URL') }}</label>
          <c-input-text v-model:value="baseUrl" raw-text placeholder="https://api.openai.com/v1" />
        </div>

        <div class="field-block">
          <label>{{ tt('fields.apiKey', 'API Key') }}</label>
          <c-input-text v-model:value="apiKey" raw-text type="password" autocomplete="off" placeholder="sk-..." />
        </div>

        <div class="field-block">
          <label>{{ tt('fields.model', 'Model code') }}</label>
          <c-input-text v-model:value="model" raw-text placeholder="gpt-4o-mini" />
        </div>

        <div class="endpoint-row">
          <span>{{ tt('fields.endpoint', 'Endpoint') }}</span>
          <code>{{ endpoint }}</code>
        </div>
      </div>

      <div class="panel message-panel">
        <div class="panel-head">
          <span class="dot dot-green" />
          <span class="panel-label">{{ tt('sections.message', 'Test message') }}</span>
        </div>

        <c-input-text
          v-model:value="message"
          multiline
          rows="9"
          raw-text
          :placeholder="tt('placeholders.message', 'Type the message to send...')"
        />

        <div class="panel-actions">
          <c-button :loading="isLoading" :disabled="!canSend" @click="runTest">
            {{ tt('actions.test', 'Send test request') }}
          </c-button>
          <c-button variant="text" @click="copyCurl()">
            {{ tt('actions.copyCurl', 'Copy curl') }}
          </c-button>
        </div>
      </div>
    </div>

    <div class="panel result-panel">
      <div class="panel-head">
        <span class="dot dot-violet" />
        <span class="panel-label">{{ tt('sections.result', 'Result') }}</span>
        <div class="result-stats">
          <span class="status-pill" :class="`status-${resultStatus}`">{{ statusLabel }}</span>
          <span v-if="statusCode !== null" class="mono metric">{{ statusCode }}</span>
          <span v-if="latencyMs !== null" class="mono metric">{{ latencyMs }}ms</span>
        </div>
      </div>

      <n-alert :type="resultType" size="small">
        <template v-if="resultStatus === 'success'">
          {{ responseText }}
        </template>
        <template v-else-if="resultStatus === 'error'">
          {{ errorMessage }}
        </template>
        <template v-else>
          {{ tt('messages.idle', 'Fill in the provider settings and send the default “你好” test message.') }}
        </template>
      </n-alert>

      <div class="output-grid">
        <div class="output-block">
          <div class="block-title">
            {{ tt('sections.curl', 'curl command') }}
          </div>
          <c-input-text :value="curlCommand" multiline rows="10" raw-text readonly monospace />
        </div>

        <div class="output-block">
          <div class="block-title">
            {{ tt('sections.raw', 'Raw response') }}
          </div>
          <c-input-text
            :value="rawResponse"
            multiline
            rows="10"
            raw-text
            readonly
            monospace
            :placeholder="tt('placeholders.raw', 'The provider response will appear here after the test.')"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.tester-root {
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-family: 'DM Sans', sans-serif;
}

.top-row,
.output-grid {
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

.panel-label,
.block-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #6b7280;
  .dark & { color: #8b949e; }
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-blue { background: #2563eb; }
.dot-green { background: #16a34a; }
.dot-violet { background: #7c3aed; }

.config-panel { border-top: 3px solid #2563eb; }
.message-panel { border-top: 3px solid #16a34a; }
.result-panel { border-top: 3px solid #7c3aed; }

.field-block {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 12px;

  label {
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
    .dark & { color: #8b949e; }
  }
}

.endpoint-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  font-size: 12px;
  color: #64748b;
  .dark & { background: #0d1117; border-color: #30363d; color: #8b949e; }

  code {
    overflow-wrap: anywhere;
    color: #0f172a;
    .dark & { color: #e6edf3; }
  }
}

.panel-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 14px;
  flex-wrap: wrap;
}

.result-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  flex-wrap: wrap;
}

.status-pill,
.metric {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  .dark & { background: #0d1117; color: #8b949e; }
}

.status-success {
  background: #dcfce7;
  color: #166534;
  .dark & { background: rgba(22, 163, 74, 0.18); color: #86efac; }
}

.status-error {
  background: #fee2e2;
  color: #991b1b;
  .dark & { background: rgba(220, 38, 38, 0.18); color: #fca5a5; }
}

.output-grid {
  margin-top: 14px;
}

.output-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (max-width: 900px) {
  .top-row,
  .output-grid {
    grid-template-columns: 1fr;
  }
}
</style>
