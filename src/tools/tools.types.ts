import type { Component } from 'vue';

export interface Tool {
  name: string
  path: string
  description: string
  keywords: string[]
  component: () => Promise<Component>
  icon: Component
  redirectFrom?: string[]
  isNew: boolean
  createdAt?: Date
  /** Lay the tool out in the wide container, for tools that arrange themselves in columns. */
  isWide?: boolean
}

export interface ToolCategory {
  name: string
  components: Tool[]
}

export type ToolWithCategory = Tool & { category: string };
