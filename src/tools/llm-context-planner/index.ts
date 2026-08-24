import { ChartBar } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.llm-context-planner.title'),
  path: '/llm-context-planner',
  description: translate('tools.llm-context-planner.description'),
  keywords: ['llm', 'ai', 'context', 'window', 'rag', 'prompt', 'tokens', 'agent'],
  component: () => import('./llm-context-planner.vue'),
  icon: ChartBar,
  layout: 'wide',
  createdAt: new Date('2026-05-30'),
});
