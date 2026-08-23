export type ChatFormat = 'openai' | 'anthropic' | 'gemini';

export interface Conversation {
  system: string
  messages: { role: 'user' | 'assistant'; content: string }[]
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

/** Content can be a plain string or a list of typed blocks; both collapse to text here. */
function toText(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((block) => {
        const record = asRecord(block);
        return typeof record?.text === 'string' ? record.text : '';
      })
      .filter(Boolean)
      .join('\n');
  }

  return '';
}

export function detectFormat(payload: unknown): ChatFormat {
  const record = asRecord(payload);

  if (record && Array.isArray(record.contents)) {
    return 'gemini';
  }
  if (record && (record.system !== undefined || record.max_tokens !== undefined) && Array.isArray(record.messages)) {
    return 'anthropic';
  }

  return 'openai';
}

export function parseConversation(payload: unknown): Conversation {
  const record = asRecord(payload);
  const format = detectFormat(payload);
  const conversation: Conversation = { system: '', messages: [] };

  if (format === 'gemini') {
    conversation.system = toText(asRecord(record?.systemInstruction)?.parts ?? asRecord(record?.system_instruction)?.parts);

    for (const entry of (record?.contents as unknown[]) ?? []) {
      const item = asRecord(entry);
      conversation.messages.push({
        role: item?.role === 'model' ? 'assistant' : 'user',
        content: toText(item?.parts),
      });
    }

    return conversation;
  }

  conversation.system = toText(record?.system);

  const rawMessages = Array.isArray(payload) ? payload : (record?.messages as unknown[]) ?? [];

  for (const entry of rawMessages) {
    const item = asRecord(entry);
    const role = item?.role;

    if (role === 'system' || role === 'developer') {
      conversation.system = [conversation.system, toText(item?.content)].filter(Boolean).join('\n');
      continue;
    }

    conversation.messages.push({
      role: role === 'assistant' || role === 'model' ? 'assistant' : 'user',
      content: toText(item?.content),
    });
  }

  return conversation;
}

export function toOpenai({ system, messages }: Conversation, model: string) {
  return {
    model,
    messages: [
      ...(system ? [{ role: 'system', content: system }] : []),
      ...messages,
    ],
  };
}

export function toAnthropic({ system, messages }: Conversation, model: string) {
  return {
    model,
    max_tokens: 1024,
    ...(system ? { system } : {}),
    messages: messages.map(message => ({
      role: message.role,
      content: [{ type: 'text', text: message.content }],
    })),
  };
}

export function toGemini({ system, messages }: Conversation) {
  return {
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    contents: messages.map(message => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    })),
  };
}

export function convert(input: string, target: ChatFormat, model: string): { output: string; source: ChatFormat; error: string | null } {
  let payload: unknown;

  try {
    payload = JSON.parse(input);
  }
  catch (error) {
    return { output: '', source: 'openai', error: error instanceof Error ? error.message : 'Invalid JSON' };
  }

  const source = detectFormat(payload);
  const conversation = parseConversation(payload);
  const converters = { openai: toOpenai, anthropic: toAnthropic, gemini: toGemini };

  return { output: JSON.stringify(converters[target](conversation, model), null, 2), source, error: null };
}
