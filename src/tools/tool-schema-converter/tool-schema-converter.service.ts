import type { JsonSchema } from '../llm-shared/gemini-schema';
import { asRecord, asSchema, fromGeminiSchema, toGeminiSchema } from '../llm-shared/gemini-schema';

export type { JsonSchema } from '../llm-shared/gemini-schema';
export { fromGeminiSchema, toGeminiSchema } from '../llm-shared/gemini-schema';

export type ToolFormat = 'openai' | 'anthropic' | 'gemini';

export interface ToolDefinition {
  name: string
  description: string
  parameters: JsonSchema
}

export interface ConversionResult {
  output: string
  source: ToolFormat
  tools: number
  warnings: string[]
  error: string | null
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function detectToolFormat(payload: unknown): ToolFormat {
  const list = Array.isArray(payload) ? payload : (asRecord(payload)?.tools as unknown[]) ?? [];

  for (const entry of list) {
    const tool = asRecord(entry);

    if (tool?.functionDeclarations !== undefined || tool?.function_declarations !== undefined) {
      return 'gemini';
    }
    if (tool?.input_schema !== undefined) {
      return 'anthropic';
    }
  }

  return 'openai';
}

export function parseTools(payload: unknown): ToolDefinition[] {
  const record = asRecord(payload);
  const list = Array.isArray(payload)
    ? payload
    : (record?.tools as unknown[]) ?? (record?.functionDeclarations as unknown[]) ?? (record?.name !== undefined ? [payload] : []);
  const tools: ToolDefinition[] = [];

  for (const entry of list) {
    const item = asRecord(entry);

    if (!item) {
      continue;
    }

    // Gemini wraps declarations in a container object
    const declarations = (item.functionDeclarations ?? item.function_declarations) as unknown[] | undefined;
    if (Array.isArray(declarations)) {
      tools.push(...parseTools(declarations));
      continue;
    }

    // OpenAI chat completions nests under `function`; the responses API is flat
    const fn = asRecord(item.function) ?? item;

    tools.push({
      name: asString(fn.name),
      description: asString(fn.description),
      parameters: fromGeminiSchema(asSchema(fn.parameters ?? fn.input_schema ?? fn.parametersJsonSchema)),
    });
  }

  return tools.filter(tool => tool.name !== '');
}

export function toOpenaiTools(tools: ToolDefinition[]) {
  return {
    tools: tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        ...(tool.description ? { description: tool.description } : {}),
        parameters: tool.parameters,
      },
    })),
  };
}

export function toAnthropicTools(tools: ToolDefinition[]) {
  return {
    tools: tools.map(tool => ({
      name: tool.name,
      ...(tool.description ? { description: tool.description } : {}),
      input_schema: tool.parameters,
    })),
  };
}

export function toGeminiTools(tools: ToolDefinition[], warnings: string[]) {
  return {
    tools: [{
      functionDeclarations: tools.map(tool => ({
        name: tool.name,
        ...(tool.description ? { description: tool.description } : {}),
        parameters: toGeminiSchema(tool.parameters, warnings, `${tool.name}.parameters`),
      })),
    }],
  };
}

export function convertTools(input: string, target: ToolFormat): ConversionResult {
  let payload: unknown;

  try {
    payload = JSON.parse(input);
  }
  catch (error) {
    return { output: '', source: 'openai', tools: 0, warnings: [], error: error instanceof Error ? error.message : 'Invalid JSON' };
  }

  const source = detectToolFormat(payload);
  const tools = parseTools(payload);
  const warnings: string[] = [];

  if (tools.length === 0) {
    return { output: '', source, tools: 0, warnings: [], error: 'No named tool definitions found in the payload.' };
  }

  const converted = target === 'gemini'
    ? toGeminiTools(tools, warnings)
    : target === 'anthropic' ? toAnthropicTools(tools) : toOpenaiTools(tools);

  return { output: JSON.stringify(converted, null, 2), source, tools: tools.length, warnings, error: null };
}
