import { Calculator } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.llm-token-cost-calculator.title'),
  path: '/llm-token-cost-calculator',
  description: translate('tools.llm-token-cost-calculator.description'),
  keywords: ['llm', 'ai', 'token', 'cost', 'price', 'prompt', 'cache', 'openai', 'claude', 'gemini'],
  component: () => import('./llm-token-cost-calculator.vue'),
  icon: Calculator,
  isWide: true,
  createdAt: new Date('2026-05-30'),
});
