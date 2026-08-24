import { Api } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.llm-api-tester.title'),
  path: '/llm-api-tester',
  description: translate('tools.llm-api-tester.description'),
  keywords: ['llm', 'ai', 'api', 'curl', 'openai', 'model', 'base url', 'api key', 'test'],
  component: () => import('./llm-api-tester.vue'),
  icon: Api,
  layout: 'wide',
  createdAt: new Date('2026-06-07'),
});
