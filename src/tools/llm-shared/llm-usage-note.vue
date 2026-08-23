<script setup lang="ts">
defineProps<{
  what: string
  steps: string[]
  tip?: string
}>();

const { t } = useI18n();
</script>

<template>
  <details class="usage-note" open>
    <summary class="usage-summary">
      <span class="usage-marker" />
      <span class="usage-title">{{ t('tools.llm-shared.usage', 'How to use') }}</span>
    </summary>

    <div class="usage-body">
      <p class="usage-what">
        {{ what }}
      </p>

      <ol class="usage-steps">
        <li v-for="step in steps" :key="step">
          {{ step }}
        </li>
      </ol>

      <p v-if="tip" class="usage-tip">
        {{ tip }}
      </p>
    </div>
  </details>
</template>

<style scoped lang="less">
.usage-note {
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  border-left: 3px solid #0ea5e9;
  background: rgba(14, 165, 233, 0.03);
  font-family: 'DM Sans', sans-serif;
  .dark & {
    background: rgba(14, 165, 233, 0.06);
    border-color: #30363d;
    border-left-color: #0ea5e9;
  }
}

.usage-summary {
  display: flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  list-style: none;
  user-select: none;

  &::-webkit-details-marker { display: none; }
}

.usage-marker {
  width: 0;
  height: 0;
  flex-shrink: 0;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  border-left: 5px solid #0ea5e9;
  transition: transform 0.15s ease;
}

.usage-note[open] .usage-marker {
  transform: rotate(90deg);
}

.usage-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #0284c7;
  .dark & { color: #38bdf8; }
}

.usage-body {
  margin-top: 10px;
  padding-left: 12px;
}

.usage-what {
  margin: 0 0 8px;
  font-size: 13px;
  line-height: 1.6;
  color: #374151;
  .dark & { color: #c9d1d9; }
}

.usage-steps {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.75;
  color: #4b5563;
  .dark & { color: #8b949e; }
}

.usage-tip {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: #9ca3af;
  .dark & { color: #6e7681; }
}
</style>
