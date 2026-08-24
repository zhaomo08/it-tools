import { Braces } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.prompt-variable-extractor.title'),
  path: '/prompt-variable-extractor',
  description: translate('tools.prompt-variable-extractor.description'),
  keywords: ['prompt', 'template', 'variable', 'extract', 'llm', 'placeholder', 'json'],
  component: () => import('./prompt-variable-extractor.vue'),
  icon: Braces,
  layout: 'wide',
  createdAt: new Date('2026-05-31'),
});
