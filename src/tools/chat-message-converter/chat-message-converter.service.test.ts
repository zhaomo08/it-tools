import { describe, expect, it } from 'vitest';
import { convert, detectFormat, parseConversation, toAnthropic, toGemini, toOpenai } from './chat-message-converter.service';

const openaiPayload = {
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: 'You are terse.' },
    { role: 'user', content: 'Hi' },
    { role: 'assistant', content: 'Hello.' },
  ],
};

describe('chat-message-converter', () => {
  it('detects each provider payload shape', () => {
    expect(detectFormat(openaiPayload)).toBe('openai');
    expect(detectFormat({ system: 'x', messages: [] })).toBe('anthropic');
    expect(detectFormat({ contents: [] })).toBe('gemini');
    expect(detectFormat([{ role: 'user', content: 'Hi' }])).toBe('openai');
  });

  it('lifts an OpenAI system message out of the message list', () => {
    const conversation = parseConversation(openaiPayload);

    expect(conversation.system).toBe('You are terse.');
    expect(conversation.messages).toEqual([
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello.' },
    ]);
  });

  it('flattens Anthropic text blocks', () => {
    const conversation = parseConversation({
      system: 'You are terse.',
      messages: [{ role: 'user', content: [{ type: 'text', text: 'Hi' }, { type: 'text', text: 'there' }] }],
    });

    expect(conversation.messages[0].content).toBe('Hi\nthere');
  });

  it('maps the Gemini model role back to assistant', () => {
    const conversation = parseConversation({
      systemInstruction: { parts: [{ text: 'You are terse.' }] },
      contents: [
        { role: 'user', parts: [{ text: 'Hi' }] },
        { role: 'model', parts: [{ text: 'Hello.' }] },
      ],
    });

    expect(conversation.system).toBe('You are terse.');
    expect(conversation.messages[1]).toEqual({ role: 'assistant', content: 'Hello.' });
  });

  it('round-trips OpenAI through Anthropic and Gemini without losing the system prompt', () => {
    const conversation = parseConversation(openaiPayload);
    const viaAnthropic = parseConversation(toAnthropic(conversation, 'claude-opus-5'));
    const viaGemini = parseConversation(toGemini(conversation));

    expect(viaAnthropic).toEqual(conversation);
    expect(viaGemini).toEqual(conversation);
    expect(toOpenai(conversation, 'gpt-4o-mini')).toEqual(openaiPayload);
  });

  it('omits the system field when there is no system prompt', () => {
    const conversation = { system: '', messages: [{ role: 'user' as const, content: 'Hi' }] };

    expect(toAnthropic(conversation, 'm')).not.toHaveProperty('system');
    expect(toGemini(conversation)).not.toHaveProperty('systemInstruction');
    expect(toOpenai(conversation, 'm').messages).toHaveLength(1);
  });

  it('reports invalid JSON instead of throwing', () => {
    const result = convert('{nope}', 'anthropic', 'm');

    expect(result.error).toBeTruthy();
    expect(result.output).toBe('');
  });

  it('converts and reports the detected source format', () => {
    const result = convert(JSON.stringify(openaiPayload), 'gemini', 'gemini-2.0-flash');

    expect(result.source).toBe('openai');
    expect(JSON.parse(result.output).contents[1].role).toBe('model');
  });
});
