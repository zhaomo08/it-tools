import { Scissors } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.rag-text-chunker.title'),
  path: '/rag-text-chunker',
  description: translate('tools.rag-text-chunker.description'),
  keywords: ['llm', 'ai', 'rag', 'chunk', 'split', 'embedding', 'vector', 'overlap', 'retrieval'],
  component: () => import('./rag-text-chunker.vue'),
  icon: Scissors,
  layout: 'wide',
  createdAt: new Date('2026-08-23'),
});
