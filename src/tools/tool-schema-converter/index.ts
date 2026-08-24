import { Puzzle } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.tool-schema-converter.title'),
  path: '/tool-schema-converter',
  description: translate('tools.tool-schema-converter.description'),
  keywords: ['llm', 'ai', 'tool', 'function', 'calling', 'schema', 'json schema', 'openai', 'anthropic', 'gemini', 'convert'],
  component: () => import('./tool-schema-converter.vue'),
  icon: Puzzle,
  isWide: true,
  createdAt: new Date('2026-08-23'),
});
