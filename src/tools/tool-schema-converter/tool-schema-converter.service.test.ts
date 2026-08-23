import { describe, expect, it } from 'vitest';
import {
  convertTools,
  detectToolFormat,
  fromGeminiSchema,
  parseTools,
  toAnthropicTools,
  toGeminiSchema,
  toGeminiTools,
  toOpenaiTools,
} from './tool-schema-converter.service';

const openaiPayload = {
  tools: [{
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get the current weather.',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'City name' },
          unit: { type: 'string', enum: ['c', 'f'] },
        },
        required: ['city'],
      },
    },
  }],
};

describe('tool-schema-converter', () => {
  it('detects each provider tool shape', () => {
    expect(detectToolFormat(openaiPayload)).toBe('openai');
    expect(detectToolFormat({ tools: [{ name: 'a', input_schema: {} }] })).toBe('anthropic');
    expect(detectToolFormat({ tools: [{ functionDeclarations: [] }] })).toBe('gemini');
  });

  it('parses the OpenAI chat completions and responses API shapes alike', () => {
    const nested = parseTools(openaiPayload);
    const flat = parseTools([{ type: 'function', name: 'get_weather', description: 'Get the current weather.', parameters: { type: 'object' } }]);

    expect(nested[0].name).toBe('get_weather');
    expect(flat[0].name).toBe('get_weather');
    expect(flat[0].description).toBe('Get the current weather.');
  });

  it('unwraps Gemini functionDeclarations containers', () => {
    const tools = parseTools({ tools: [{ functionDeclarations: [{ name: 'a', parameters: { type: 'OBJECT' } }, { name: 'b' }] }] });

    expect(tools.map(tool => tool.name)).toEqual(['a', 'b']);
    expect(tools[0].parameters.type).toBe('object');
  });

  it('drops tools that have no name', () => {
    expect(parseTools({ tools: [{ type: 'function', function: { description: 'nameless' } }] })).toEqual([]);
  });

  it('defaults a missing parameter schema to an empty object schema', () => {
    expect(parseTools([{ name: 'ping' }])[0].parameters).toEqual({ type: 'object', properties: {} });
  });

  it('uppercases types and reports keywords Gemini cannot take', () => {
    const warnings: string[] = [];
    const schema = toGeminiSchema({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      additionalProperties: false,
      properties: {
        city: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
      },
    }, warnings);

    expect(schema.type).toBe('OBJECT');
    expect((schema.properties as any).tags.items.type).toBe('STRING');
    expect(schema).not.toHaveProperty('additionalProperties');
    expect(warnings).toEqual([
      'parameters.$schema: not supported by Gemini, dropped',
      'parameters.additionalProperties: not supported by Gemini, dropped',
    ]);
  });

  it('turns a nullable union type into type + nullable', () => {
    const warnings: string[] = [];

    expect(toGeminiSchema({ type: ['string', 'null'] }, warnings)).toEqual({ type: 'STRING', nullable: true });
    expect(warnings).toEqual([]);
  });

  it('keeps the first type of a multi-type union and warns about the rest', () => {
    const warnings: string[] = [];

    expect(toGeminiSchema({ type: ['string', 'number'] }, warnings).type).toBe('STRING');
    expect(warnings[0]).toContain('dropped "number"');
  });

  it('rewrites const as a single-value enum', () => {
    expect(toGeminiSchema({ const: 'celsius' }, [])).toEqual({ enum: ['celsius'] });
  });

  it('reverses the Gemini casing and nullable flag', () => {
    expect(fromGeminiSchema({ type: 'STRING', nullable: true })).toEqual({ type: ['string', 'null'] });
    expect(fromGeminiSchema({ type: 'ARRAY', items: { type: 'INTEGER' } })).toEqual({ type: 'array', items: { type: 'integer' } });
  });

  it('round-trips OpenAI through Anthropic and Gemini', () => {
    const tools = parseTools(openaiPayload);

    expect(parseTools(toAnthropicTools(tools))).toEqual(tools);
    expect(parseTools(toGeminiTools(tools, []))).toEqual(tools);
    expect(toOpenaiTools(tools)).toEqual(openaiPayload);
  });

  it('converts and surfaces the tool count, source and warnings', () => {
    const result = convertTools(JSON.stringify({
      tools: [{ type: 'function', function: { name: 'a', parameters: { type: 'object', additionalProperties: false } } }],
    }), 'gemini');

    expect(result.source).toBe('openai');
    expect(result.tools).toBe(1);
    expect(result.warnings).toHaveLength(1);
    expect(JSON.parse(result.output).tools[0].functionDeclarations[0].parameters.type).toBe('OBJECT');
  });

  it('reports invalid JSON and payloads with no tools instead of throwing', () => {
    expect(convertTools('{nope}', 'openai').error).toBeTruthy();
    expect(convertTools('{"tools":[]}', 'openai').error).toContain('No named tool definitions');
  });
});
