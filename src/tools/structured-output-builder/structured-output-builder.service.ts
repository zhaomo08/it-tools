import type { JsonSchema } from '../llm-shared/gemini-schema';
import { asRecord, asSchema, toGeminiSchema } from '../llm-shared/gemini-schema';

export type OutputTarget = 'openai' | 'anthropic' | 'gemini';
export type InputMode = 'schema' | 'sample';

export interface BuildResult {
  output: string
  notes: string[]
  error: string | null
}

/** Infers a JSON Schema from an example payload, so you can paste the output you want. */
export function inferSchema(value: unknown): JsonSchema {
  if (Array.isArray(value)) {
    return { type: 'array', items: value.length > 0 ? inferSchema(value[0]) : {} };
  }

  const record = asRecord(value);
  if (record) {
    const properties: JsonSchema = {};
    for (const [key, child] of Object.entries(record)) {
      properties[key] = inferSchema(child);
    }
    return { type: 'object', properties, required: Object.keys(properties) };
  }

  if (value === null) {
    return { type: 'null' };
  }
  if (typeof value === 'number') {
    return { type: Number.isInteger(value) ? 'integer' : 'number' };
  }
  if (typeof value === 'boolean') {
    return { type: 'boolean' };
  }

  return { type: 'string' };
}

/**
 * OpenAI strict mode refuses a schema unless every object forbids extra properties and
 * lists all of its properties as required. Optional fields must be expressed as a nullable type.
 */
export function applyOpenaiStrict(schema: JsonSchema, notes: string[], path = 'schema'): JsonSchema {
  const result: JsonSchema = { ...schema };

  if (result.type === 'object' || result.properties !== undefined) {
    const properties: JsonSchema = {};
    for (const [key, child] of Object.entries(asRecord(result.properties) ?? {})) {
      properties[key] = applyOpenaiStrict(asSchema(child), notes, `${path}.${key}`);
    }
    result.properties = properties;

    const keys = Object.keys(properties);
    const required = Array.isArray(result.required) ? result.required.filter(key => typeof key === 'string') as string[] : [];
    const missing = keys.filter(key => !required.includes(key));

    if (missing.length > 0) {
      notes.push(`${path}: strict mode requires every key — added ${missing.map(key => `"${key}"`).join(', ')} to required`);
    }
    result.required = keys;

    if (result.additionalProperties !== false) {
      notes.push(`${path}: set additionalProperties to false`);
      result.additionalProperties = false;
    }
  }

  if (result.items !== undefined) {
    result.items = applyOpenaiStrict(asSchema(result.items), notes, `${path}[]`);
  }

  return result;
}

export function toOpenaiResponseFormat(schema: JsonSchema, name: string, notes: string[]) {
  return {
    response_format: {
      type: 'json_schema',
      json_schema: {
        name,
        strict: true,
        schema: applyOpenaiStrict(schema, notes),
      },
    },
  };
}

/** Anthropic has no response_format, so a forced single tool call is the way to pin the shape. */
export function toAnthropicToolChoice(schema: JsonSchema, name: string) {
  return {
    tools: [{
      name,
      description: `Return the result as ${name}.`,
      input_schema: schema,
    }],
    tool_choice: { type: 'tool', name },
  };
}

export function toGeminiResponseSchema(schema: JsonSchema, notes: string[]) {
  return {
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: toGeminiSchema(schema, notes, 'schema'),
    },
  };
}

export function buildStructuredOutput(input: string, mode: InputMode, target: OutputTarget, name: string): BuildResult {
  let payload: unknown;

  try {
    payload = JSON.parse(input);
  }
  catch (error) {
    return { output: '', notes: [], error: error instanceof Error ? error.message : 'Invalid JSON' };
  }

  const schema = mode === 'sample' ? inferSchema(payload) : asSchema(payload);

  if (asRecord(payload) === null && mode === 'schema') {
    return { output: '', notes: [], error: 'A JSON Schema must be an object.' };
  }

  const notes: string[] = [];
  const safeName = name.trim() || 'result';
  const builders = {
    openai: () => toOpenaiResponseFormat(schema, safeName, notes),
    anthropic: () => toAnthropicToolChoice(schema, safeName),
    gemini: () => toGeminiResponseSchema(schema, notes),
  };

  return { output: JSON.stringify(builders[target](), null, 2), notes, error: null };
}
