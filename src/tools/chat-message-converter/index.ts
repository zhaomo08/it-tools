import { Repeat } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.chat-message-converter.title'),
  path: '/chat-message-converter',
  description: translate('tools.chat-message-converter.description'),
  keywords: ['llm', 'ai', 'chat', 'messages', 'openai', 'anthropic', 'claude', 'gemini', 'convert', 'format', 'payload'],
  component: () => import('./chat-message-converter.vue'),
  icon: Repeat,
  isWide: true,
  createdAt: new Date('2026-08-23'),
});
