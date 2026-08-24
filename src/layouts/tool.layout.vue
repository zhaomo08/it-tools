<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { useHead } from '@vueuse/head';
import type { HeadObject } from '@vueuse/head';

import BaseLayout from './base.layout.vue';
import FavoriteButton from '@/components/FavoriteButton.vue';
import type { Tool } from '@/tools/tools.types';

const route = useRoute();

const head = computed<HeadObject>(() => ({
  title: `${route.meta.name} - IT Tools`,
  meta: [
    {
      name: 'description',
      content: route.meta?.description as string,
    },
    {
      name: 'keywords',
      content: ((route.meta.keywords ?? []) as string[]).join(','),
    },
  ],
}));
useHead(head);
const { t } = useI18n();

const isWide = computed<boolean>(() => route.meta.isWide === true);

const i18nKey = computed<string>(() => route.path.trim().replace('/', ''));
const toolTitle = computed<string>(() => t(`tools.${i18nKey.value}.title`, String(route.meta.name)));
const toolDescription = computed<string>(() => t(`tools.${i18nKey.value}.description`, String(route.meta.description)));
</script>

<template>
  <BaseLayout>
    <div class="tool-layout" :class="{ 'is-wide': isWide }">
      <div class="tool-header">
        <div flex flex-nowrap items-center justify-between>
          <n-h1>
            {{ toolTitle }}
          </n-h1>

          <div>
            <FavoriteButton :tool="{ name: route.meta.name, path: route.path } as Tool" />
          </div>
        </div>

        <div class="separator" />

        <div class="description">
          {{ toolDescription }}
        </div>
      </div>
    </div>

    <div class="tool-content" :class="{ 'is-wide': isWide }">
      <slot />
    </div>
  </BaseLayout>
</template>

<style lang="less" scoped>
// Tools that arrange themselves in columns opt into a wider container. The
// header has to match it, otherwise the title no longer lines up with the
// content below. Everything else keeps the original 600px column.
@tool-width: 600px;
@tool-width-wide: 1200px;

.tool-content {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;

  ::v-deep(& > *) {
    flex: 0 1 @tool-width;
  }

  &.is-wide {
    max-width: @tool-width-wide;
    margin: 0 auto;

    ::v-deep(& > *) {
      flex: 1 1 100%;
      max-width: 100%;
    }
  }
}

.tool-layout {
  max-width: @tool-width;
  margin: 0 auto;
  box-sizing: border-box;

  &.is-wide {
    max-width: @tool-width-wide;
  }

  .tool-header {
    padding: 40px 0;
    width: 100%;

    .n-h1 {
      opacity: 0.9;
      font-size: 40px;
      font-weight: 400;
      margin: 0;
      line-height: 1;
    }

    .separator {
      width: 200px;
      height: 2px;
      background: rgb(161, 161, 161);
      opacity: 0.2;

      margin: 10px 0;
    }

    .description {
      margin: 0;

      opacity: 0.7;
      white-space: pre-line;
    }
  }
}
</style>
