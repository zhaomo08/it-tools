import { describe, expect, it } from 'vitest';
import { extractDataLines, parseStream } from './llm-stream-parser.service';

describe('llm-stream-parser', () => {
  it('drops framing, comments and the [DONE] sentinel', () => {
    const { payloads, doneMarker } = extractDataLines([
      ': keep-alive',
      'event: message',
      'data: {"a":1}',
      '',
      'data: [DONE]',
    ].join('\n'));

    expect(payloads).toEqual(['{"a":1}']);
    expect(doneMarker).toBe(true);
  });

  it('reassembles an OpenAI chat completion stream', () => {
    const result = parseStream([
      'data: {"model":"gpt-4o-mini","choices":[{"delta":{"content":"Hel"}}]}',
      'data: {"choices":[{"delta":{"content":"lo"},"finish_reason":"stop"}]}',
      'data: {"usage":{"total_tokens":12}}',
      'data: [DONE]',
    ].join('\n'));

    expect(result.text).toBe('Hello');
    expect(result.model).toBe('gpt-4o-mini');
    expect(result.finishReason).toBe('stop');
    expect(result.usage).toEqual({ total_tokens: 12 });
    expect(result.contentChunks).toBe(2);
    expect(result.doneMarker).toBe(true);
  });

  it('reassembles Anthropic content_block_delta events', () => {
    const result = parseStream([
      'event: message_start',
      'data: {"type":"message_start","message":{"model":"claude-opus-5","usage":{"input_tokens":9}}}',
      'event: content_block_delta',
      'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hi"}}',
      'event: message_delta',
      'data: {"type":"message_delta","delta":{"stop_reason":"end_turn"}}',
    ].join('\n'));

    expect(result.text).toBe('Hi');
    expect(result.model).toBe('claude-opus-5');
    expect(result.finishReason).toBe('end_turn');
    expect(result.usage).toEqual({ input_tokens: 9 });
  });

  it('reassembles Gemini candidate parts', () => {
    const result = parseStream('data: {"candidates":[{"content":{"parts":[{"text":"你好"}]},"finishReason":"STOP"}],"usageMetadata":{"totalTokenCount":4}}');

    expect(result.text).toBe('你好');
    expect(result.finishReason).toBe('STOP');
    expect(result.usage).toEqual({ totalTokenCount: 4 });
  });

  it('collects tool call arguments and reports malformed payloads', () => {
    const result = parseStream([
      'data: {"choices":[{"delta":{"tool_calls":[{"function":{"arguments":"{\\"city\\":"}}]}}]}',
      'data: {"choices":[{"delta":{"tool_calls":[{"function":{"arguments":"\\"Paris\\"}"}}]}}]}',
      'data: {oops}',
    ].join('\n'));

    expect(result.toolArguments).toBe('{"city":"Paris"}');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Payload 3');
  });
});
