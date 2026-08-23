export interface StreamParseResult {
  text: string
  reasoning: string
  toolArguments: string
  payloads: number
  contentChunks: number
  doneMarker: boolean
  model: string | null
  finishReason: string | null
  usage: Record<string, number> | null
  errors: string[]
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function flattenUsage(value: unknown): Record<string, number> | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const usage: Record<string, number> = {};
  for (const [key, entry] of Object.entries(record)) {
    if (typeof entry === 'number') {
      usage[key] = entry;
    }
  }

  return Object.keys(usage).length > 0 ? usage : null;
}

/** Strips the `data:`/`event:` framing and drops keep-alive comments, returning the JSON payload lines. */
export function extractDataLines(raw: string): { payloads: string[]; doneMarker: boolean } {
  const payloads: string[] = [];
  let doneMarker = false;

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (trimmed === '' || trimmed.startsWith(':') || /^(?:event|id|retry):/.test(trimmed)) {
      continue;
    }

    const body = trimmed.startsWith('data:') ? trimmed.slice(5).trim() : trimmed;

    if (body === '[DONE]') {
      doneMarker = true;
      continue;
    }

    payloads.push(body);
  }

  return { payloads, doneMarker };
}

/**
 * Reassembles a streamed LLM response. Understands OpenAI chat completions, the OpenAI
 * responses API, Anthropic messages, and Gemini streamGenerateContent chunk shapes.
 */
export function parseStream(raw: string): StreamParseResult {
  const { payloads, doneMarker } = extractDataLines(raw);
  const result: StreamParseResult = {
    text: '',
    reasoning: '',
    toolArguments: '',
    payloads: payloads.length,
    contentChunks: 0,
    doneMarker,
    model: null,
    finishReason: null,
    usage: null,
    errors: [],
  };

  payloads.forEach((payload, index) => {
    let parsed: unknown;

    try {
      parsed = JSON.parse(payload);
    }
    catch {
      result.errors.push(`Payload ${index + 1}: not valid JSON — ${payload.slice(0, 60)}`);
      return;
    }

    const chunk = asRecord(parsed);
    if (!chunk) {
      return;
    }

    const before = result.text.length + result.reasoning.length + result.toolArguments.length;

    result.model = asString(chunk.model) || result.model;
    result.usage = flattenUsage(chunk.usage) ?? flattenUsage(chunk.usageMetadata) ?? result.usage;

    // OpenAI chat completions: choices[].delta
    const choice = asRecord((chunk.choices as unknown[])?.[0]);
    if (choice) {
      const delta = asRecord(choice.delta) ?? asRecord(choice.message);
      result.text += asString(delta?.content);
      result.reasoning += asString(delta?.reasoning_content) + asString(delta?.reasoning);
      for (const call of (delta?.tool_calls as unknown[] | undefined) ?? []) {
        result.toolArguments += asString(asRecord(asRecord(call)?.function)?.arguments);
      }
      result.finishReason = asString(choice.finish_reason) || result.finishReason;
    }

    // Anthropic messages + OpenAI responses API: typed events
    const delta = asRecord(chunk.delta);
    if (delta) {
      result.text += asString(delta.text);
      result.reasoning += asString(delta.thinking);
      result.toolArguments += asString(delta.partial_json);
      result.finishReason = asString(delta.stop_reason) || result.finishReason;
    }
    if (asString(chunk.type).endsWith('output_text.delta')) {
      result.text += asString(chunk.delta);
    }
    const message = asRecord(chunk.message);
    if (message) {
      result.model = asString(message.model) || result.model;
      result.usage = flattenUsage(message.usage) ?? result.usage;
    }

    // Gemini: candidates[].content.parts[].text
    const candidate = asRecord((chunk.candidates as unknown[])?.[0]);
    if (candidate) {
      for (const part of (asRecord(candidate.content)?.parts as unknown[] | undefined) ?? []) {
        result.text += asString(asRecord(part)?.text);
      }
      result.finishReason = asString(candidate.finishReason) || result.finishReason;
    }

    if (result.text.length + result.reasoning.length + result.toolArguments.length > before) {
      result.contentChunks += 1;
    }
  });

  return result;
}
