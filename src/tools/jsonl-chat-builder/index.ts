import { Messages } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.jsonl-chat-builder.title'),
  path: '/jsonl-chat-builder',
  description: translate('tools.jsonl-chat-builder.description'),
  keywords: ['ai', 'llm', 'jsonl', 'batch', 'chat', 'dataset', 'openai'],
  component: () => import('./jsonl-chat-builder.vue'),
  icon: Messages,
  isWide: true,
  createdAt: new Date('2026-05-31'),
});
