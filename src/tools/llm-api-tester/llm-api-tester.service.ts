export interface LlmTestRequest {
  baseUrl: string
  apiKey: string
  model: string
  message: string
}

export interface ChatCompletionSummary {
  content: string
  model: string
  totalTokens: number | null
}

interface ChatCompletionChoice {
  message?: {
    role?: string
    content?: unknown
  }
}

interface ChatCompletionResponse {
  model?: unknown
  choices?: ChatCompletionChoice[]
  usage?: {
    total_tokens?: unknown
  }
}

export function buildChatCompletionsUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');

  if (trimmed.endsWith('/chat/completions')) {
    return trimmed;
  }

  return `${trimmed}/chat/completions`;
}

export function buildRequestBody({ model, message }: Pick<LlmTestRequest, 'model' | 'message'>) {
  return {
    model: model.trim(),
    messages: [
      {
        role: 'user',
        content: message,
      },
    ],
    temperature: 0,
    stream: false,
  };
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, String.raw`'\''`)}'`;
}

function shellDoubleQuote(value: string): string {
  return `"${value.replace(/(["\\$`])/g, '\\$1').replace(/\n/g, String.raw`\n`)}"`;
}

export function buildCurlCommand(request: LlmTestRequest): string {
  const body = JSON.stringify(buildRequestBody(request), null, 2);
  const lines = [
    `API_KEY=${shellDoubleQuote(request.apiKey)}`,
    `curl ${shellQuote(buildChatCompletionsUrl(request.baseUrl))} \\`,
    '  -H "Authorization: Bearer $API_KEY" \\',
    '  -H "Content-Type: application/json" \\',
    `  -d ${shellQuote(body)}`,
  ];

  return lines.join('\n');
}

export function summarizeChatCompletion(response: unknown): ChatCompletionSummary {
  const data = response as ChatCompletionResponse;
  const content = data.choices?.find(choice => typeof choice.message?.content === 'string')?.message?.content;
  const totalTokens = typeof data.usage?.total_tokens === 'number' ? data.usage.total_tokens : null;

  return {
    content: typeof content === 'string' ? content : '',
    model: typeof data.model === 'string' ? data.model : '',
    totalTokens,
  };
}
