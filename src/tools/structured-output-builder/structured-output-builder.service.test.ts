import { describe, expect, it } from 'vitest';
import {
  applyOpenaiStrict,
  buildStructuredOutput,
  inferSchema,
  toAnthropicToolChoice,
  toGeminiResponseSchema,
  toOpenaiResponseFormat,
} from './structured-output-builder.service';

describe('structured-output-builder', () => {
  it('infers a schema from an example payload', () => {
    expect(inferSchema({ title: 'x', score: 3, ratio: 1.5, ok: true, tags: ['a'], meta: null })).toEqual({
      type: 'object',
      properties: {
        title: { type: 'string' },
        score: { type: 'integer' },
        ratio: { type: 'number' },
        ok: { type: 'boolean' },
        tags: { type: 'array', items: { type: 'string' } },
        meta: { type: 'null' },
      },
      required: ['title', 'score', 'ratio', 'ok', 'tags', 'meta'],
    });
  });

  it('infers nested objects inside arrays from the first element', () => {
    const schema = inferSchema([{ id: 1 }]) as any;

    expect(schema.type).toBe('array');
    expect(schema.items.properties.id).toEqual({ type: 'integer' });
  });

  it('leaves an empty array without an item schema', () => {
    expect(inferSchema([])).toEqual({ type: 'array', items: {} });
  });

  it('makes every key required and forbids extra properties for strict mode', () => {
    const notes: string[] = [];
    const strict = applyOpenaiStrict({
      type: 'object',
      properties: { a: { type: 'string' }, b: { type: 'string' } },
      required: ['a'],
    }, notes);

    expect(strict.required).toEqual(['a', 'b']);
    expect(strict.additionalProperties).toBe(false);
    expect(notes[0]).toContain('added "b" to required');
    expect(notes[1]).toContain('additionalProperties');
  });

  it('applies strict mode recursively through nested objects and arrays', () => {
    const strict = applyOpenaiStrict({
      type: 'object',
      properties: {
        items: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' } } } },
      },
    }, []) as any;

    expect(strict.properties.items.items.additionalProperties).toBe(false);
    expect(strict.properties.items.items.required).toEqual(['id']);
  });

  it('stays quiet when the schema already satisfies strict mode', () => {
    const notes: string[] = [];
    applyOpenaiStrict({ type: 'object', properties: { a: { type: 'string' } }, required: ['a'], additionalProperties: false }, notes);

    expect(notes).toEqual([]);
  });

  it('wraps the schema in the shape each provider expects', () => {
    const schema = { type: 'object', properties: { a: { type: 'string' } }, required: ['a'], additionalProperties: false };

    expect(toOpenaiResponseFormat(schema, 'answer', []).response_format.json_schema).toMatchObject({ name: 'answer', strict: true });
    expect(toAnthropicToolChoice(schema, 'answer').tool_choice).toEqual({ type: 'tool', name: 'answer' });
    expect(toGeminiResponseSchema(schema, []).generationConfig.responseMimeType).toBe('application/json');
  });

  it('projects the Gemini response schema onto its supported subset', () => {
    const notes: string[] = [];
    const config = toGeminiResponseSchema({ type: 'object', additionalProperties: false, properties: { a: { type: 'string' } } }, notes);

    expect((config.generationConfig.responseSchema as any).type).toBe('OBJECT');
    expect(notes[0]).toContain('additionalProperties');
  });

  it('builds from an example payload end to end', () => {
    const result = buildStructuredOutput('{"city":"Shanghai","days":3}', 'sample', 'openai', 'forecast');
    const schema = JSON.parse(result.output).response_format.json_schema;

    expect(schema.name).toBe('forecast');
    expect(schema.schema.properties.days).toEqual({ type: 'integer' });
    expect(schema.schema.additionalProperties).toBe(false);
  });

  it('falls back to a default name and reports bad input', () => {
    expect(JSON.parse(buildStructuredOutput('{}', 'schema', 'anthropic', '  ').output).tools[0].name).toBe('result');
    expect(buildStructuredOutput('{oops}', 'schema', 'openai', 'x').error).toBeTruthy();
    expect(buildStructuredOutput('[1,2]', 'schema', 'openai', 'x').error).toContain('must be an object');
  });
});
