import { Database } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.kv-cache-calculator.title'),
  path: '/kv-cache-calculator',
  description: translate('tools.kv-cache-calculator.description'),
  keywords: ['llm', 'ai', 'kv cache', 'cache hit', 'prefix caching', 'vram', 'memory', 'transformer'],
  component: () => import('./kv-cache-calculator.vue'),
  icon: Database,
  isWide: true,
  createdAt: new Date('2026-05-30'),
});
