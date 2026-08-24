<script lang="ts" setup>
import BaseLayout from './base.layout.vue';
import ToolHeader from './tool-header.vue';
</script>

<template>
  <BaseLayout>
    <div class="tool-layout">
      <ToolHeader />
    </div>

    <div class="tool-content">
      <slot />
    </div>
  </BaseLayout>
</template>

<style lang="less" scoped>
// For tools that lay themselves out in columns: one panel spans the container.
// The header widens with it, otherwise the title stops lining up with the
// panels underneath.
@tool-width: 1200px;

.tool-content {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;

  max-width: @tool-width;
  margin: 0 auto;

  ::v-deep(& > *) {
    flex: 1 1 100%;
    max-width: 100%;
  }
}

.tool-layout {
  max-width: @tool-width;
  margin: 0 auto;
  box-sizing: border-box;
}
</style>
