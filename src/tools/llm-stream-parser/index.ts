import { Activity } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.llm-stream-parser.title'),
  path: '/llm-stream-parser',
  description: translate('tools.llm-stream-parser.description'),
  keywords: ['llm', 'ai', 'sse', 'stream', 'streaming', 'delta', 'chunk', 'openai', 'anthropic', 'gemini', 'debug'],
  component: () => import('./llm-stream-parser.vue'),
  icon: Activity,
  isWide: true,
  createdAt: new Date('2026-08-23'),
});
