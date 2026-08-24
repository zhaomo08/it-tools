import { ListCheck } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.json-output-key-checker.title'),
  path: '/json-output-key-checker',
  description: translate('tools.json-output-key-checker.description'),
  keywords: ['ai', 'json', 'schema', 'validation', 'output', 'llm', 'keys'],
  component: () => import('./json-output-key-checker.vue'),
  icon: ListCheck,
  isWide: true,
  createdAt: new Date('2026-05-31'),
});
