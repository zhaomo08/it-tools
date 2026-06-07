import { describe, expect, it } from 'vitest';
import { buildChatCompletionsUrl, buildCurlCommand, buildRequestBody, summarizeChatCompletion } from './llm-api-tester.service';

describe('llm-api-tester service', () => {
  it('normalizes base URLs to the chat completions endpoint', () => {
    expect(buildChatCompletionsUrl('https://api.openai.com/v1')).toBe('https://api.openai.com/v1/chat/completions');
    expect(buildChatCompletionsUrl('https://api.openai.com/v1/chat/completions')).toBe('https://api.openai.com/v1/chat/completions');
    expect(buildChatCompletionsUrl(' https://example.com/openai/ ')).toBe('https://example.com/openai/chat/completions');
  });

  it('builds a chat completion body from model and editable message', () => {
    expect(buildRequestBody({
      model: 'gpt-4o-mini',
      message: '你好',
    })).toEqual({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: '你好' }],
      temperature: 0,
      stream: false,
    });
  });

  it('creates a shell-safe curl command with the api key assigned once', () => {
    const curl = buildCurlCommand({
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-real-secret',
      model: 'gpt-4o-mini',
      message: '你好',
    });

    expect(curl).toContain('https://api.openai.com/v1/chat/completions');
    expect(curl).toContain('Authorization: Bearer $API_KEY');
    expect(curl).toContain('API_KEY="sk-real-secret"');
    expect(curl).toContain('"content": "你好"');
  });

  it('summarizes the first assistant message from a chat completion response', () => {
    expect(summarizeChatCompletion({
      id: 'chatcmpl-test',
      model: 'gpt-4o-mini',
      choices: [
        {
          message: {
            role: 'assistant',
            content: '你好！配置正常。',
          },
        },
      ],
      usage: {
        prompt_tokens: 8,
        completion_tokens: 5,
        total_tokens: 13,
      },
    })).toEqual({
      content: '你好！配置正常。',
      model: 'gpt-4o-mini',
      totalTokens: 13,
    });
  });
});
