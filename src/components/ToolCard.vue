<script setup lang="ts">
import { useThemeVars } from 'naive-ui';
import FavoriteButton from './FavoriteButton.vue';
import type { Tool } from '@/tools/tools.types';

const props = defineProps<{ tool: Tool & { category: string } }>();
const { tool } = toRefs(props);
const theme = useThemeVars();
const { t } = useI18n();
const isAiTool = computed(() => tool.value.category === t('tools.categories.ai', 'AI'));
</script>

<template>
  <router-link :to="tool.path" class="tool-card-link decoration-none">
    <c-card class="tool-card h-full" :class="{ 'ai-tool-card': isAiTool }">
      <div v-if="isAiTool" class="ai-card-bar" />
      <div flex items-center justify-between>
        <n-icon
          size="38"
          :component="tool.icon"
          :class="isAiTool ? 'ai-tool-icon' : 'card-icon'"
        />

        <div flex items-center gap-8px>
          <div
            v-if="tool.isNew"
            class="new-badge"
            :style="{ 'background-color': theme.primaryColor }"
          >
            {{ $t('toolCard.new') }}
          </div>
          <FavoriteButton :tool="tool" />
        </div>
      </div>

      <div class="tool-name">
        {{ tool.name }}
      </div>

      <div class="tool-desc">
        {{ tool.description }}
      </div>
    </c-card>
  </router-link>
</template>

<style scoped lang="less">
.tool-card-link {
  display: block;
  height: 100%;
}

.tool-card {
  height: 100%;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease !important;
  border: 1.5px solid transparent !important;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(34, 197, 94, 0.12), 0 2px 8px rgba(0,0,0,0.08) !important;
    border-color: rgba(34, 197, 94, 0.4) !important;
  }
}

.ai-tool-card {
  position: relative;
  overflow: hidden;

  &:hover {
    box-shadow: 0 8px 28px rgba(56, 189, 248, 0.15), 0 2px 8px rgba(0,0,0,0.08) !important;
    border-color: rgba(56, 189, 248, 0.4) !important;
  }
}

.ai-card-bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(180deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%);
  border-radius: 2px 0 0 2px;
}

.card-icon {
  color: #94a3b8;
  transition: color 0.15s;

  .tool-card:hover & {
    color: #22c55e;
  }
}

.ai-tool-icon {
  color: #38bdf8;
  transition: color 0.15s;

  .tool-card:hover & {
    color: #7dd3fc;
  }
}

.new-badge {
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: #fff;

  .dark & {
    color: #0d1117;
  }
}

.tool-name {
  margin: 8px 0 4px;
  font-size: 15px;
  font-weight: 500;
  color: #1f2328;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  .dark & {
    color: #e6edf3;
  }
}

.tool-desc {
  font-size: 13px;
  line-height: 1.5;
  color: #656d76;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  .dark & {
    color: #7d8590;
  }
}
</style>
