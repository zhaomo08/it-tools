import { Braces } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.structured-output-builder.title'),
  path: '/structured-output-builder',
  description: translate('tools.structured-output-builder.description'),
  keywords: ['llm', 'ai', 'structured', 'output', 'json', 'schema', 'strict', 'response format', 'openai', 'anthropic', 'gemini'],
  component: () => import('./structured-output-builder.vue'),
  icon: Braces,
  createdAt: new Date('2026-08-23'),
});
