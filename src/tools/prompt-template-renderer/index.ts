import { Template } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.prompt-template-renderer.title'),
  path: '/prompt-template-renderer',
  description: translate('tools.prompt-template-renderer.description'),
  keywords: ['ai', 'prompt', 'template', 'render', 'variable', 'placeholder', 'llm'],
  component: () => import('./prompt-template-renderer.vue'),
  icon: Template,
  layout: 'wide',
  createdAt: new Date('2026-05-31'),
});
