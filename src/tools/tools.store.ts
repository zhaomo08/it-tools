import { type MaybeRef, get, useStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import type { Ref } from 'vue';
import _ from 'lodash';
import type { Tool, ToolCategory, ToolWithCategory } from './tools.types';
import { toolsWithCategory } from './index';

export const useToolStore = defineStore('tools', () => {
  const favoriteToolsName = useStorage('favoriteToolsName', []) as Ref<string[]>;
  const { t } = useI18n();
  // Every AI sub-category is named `AI …` in each locale, which keeps them grouped and pinned to the top.
  const isAiCategory = (category: string) => category.startsWith('AI');

  const tools = computed<ToolWithCategory[]>(() => {
    const localizedTools = toolsWithCategory.map((tool) => {
      const toolI18nKey = tool.path.replace(/\//g, '');

      return ({
        ...tool,
        path: tool.path,
        name: t(`tools.${toolI18nKey}.title`, tool.name),
        description: t(`tools.${toolI18nKey}.description`, tool.description),
        category: t(`tools.categories.${tool.category.toLowerCase()}`, tool.category),
      });
    });

    return localizedTools.sort((a, b) => {
      const aIsAi = isAiCategory(a.category);
      const bIsAi = isAiCategory(b.category);

      if (aIsAi === bIsAi) {
        return 0;
      }

      return aIsAi ? -1 : 1;
    });
  });

  const toolsByCategory = computed<ToolCategory[]>(() => {
    const categories = _.chain(tools.value)
      .groupBy('category')
      .map((components, name, path) => ({
        name,
        path,
        components,
      }))
      .value();

    return categories.sort((a, b) => {
      const aIsAi = isAiCategory(a.name);
      const bIsAi = isAiCategory(b.name);

      if (aIsAi === bIsAi) {
        return 0;
      }

      return aIsAi ? -1 : 1;
    });
  });

  const aiTools = computed(() => tools.value.filter(tool => isAiCategory(tool.category)));

  const favoriteTools = computed(() => {
    return favoriteToolsName.value
      .map(favoriteName => tools.value.find(({ name, path }) => name === favoriteName || path === favoriteName))
      .filter(Boolean) as ToolWithCategory[]; // cast because .filter(Boolean) does not remove undefined from type
  });

  return {
    tools,
    favoriteTools,
    toolsByCategory,
    aiTools,
    newTools: computed(() => tools.value.filter(({ isNew }) => isNew)),

    addToolToFavorites({ tool }: { tool: MaybeRef<Tool> }) {
      const toolPath = get(tool).path;
      if (toolPath) {
        favoriteToolsName.value.push(toolPath);
      }
    },

    removeToolFromFavorites({ tool }: { tool: MaybeRef<Tool> }) {
      favoriteToolsName.value = favoriteToolsName.value.filter(name => get(tool).name !== name && get(tool).path !== name);
    },

    isToolFavorite({ tool }: { tool: MaybeRef<Tool> }) {
      return favoriteToolsName.value.includes(get(tool).name)
        || favoriteToolsName.value.includes(get(tool).path);
    },

    updateFavoriteTools(newOrder: ToolWithCategory[]) {
      favoriteToolsName.value = newOrder.map(tool => tool.path);
    },
  };
});
