import type { Component } from 'vue';

export type ToolLayout = 'default' | 'wide';

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
  /** Which layout component renders the tool. 'wide' is for tools that lay themselves out in columns. */
  layout?: ToolLayout
}

export interface ToolCategory {
  name: string
  components: Tool[]
}

export type ToolWithCategory = Tool & { category: string };
