export type JsonSchema = Record<string, unknown>;

/** Keys Gemini accepts inside a schema; everything else is dropped. */
const geminiSchemaKeys = new Set([
  'type', 'format', 'title', 'description', 'nullable', 'enum', 'items', 'properties',
  'required', 'minItems', 'maxItems', 'minProperties', 'maxProperties', 'minLength',
  'maxLength', 'pattern', 'minimum', 'maximum', 'default', 'example', 'anyOf', 'propertyOrdering',
]);

export function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export function asSchema(value: unknown): JsonSchema {
  return asRecord(value) ?? { type: 'object', properties: {} };
}

/** Normalizes Gemini's uppercase types and `nullable` flag back to plain JSON Schema. */
export function fromGeminiSchema(schema: JsonSchema): JsonSchema {
  const result: JsonSchema = {};

  for (const [key, value] of Object.entries(schema)) {
    if (key === 'nullable') {
      continue;
    }

    if (key === 'type' && typeof value === 'string') {
      const lowered = value.toLowerCase();
      result.type = schema.nullable === true ? [lowered, 'null'] : lowered;
      continue;
    }

    if (key === 'properties') {
      const properties: JsonSchema = {};
      for (const [property, child] of Object.entries(asRecord(value) ?? {})) {
        properties[property] = fromGeminiSchema(asSchema(child));
      }
      result.properties = properties;
      continue;
    }

    if (key === 'items') {
      result.items = fromGeminiSchema(asSchema(value));
      continue;
    }

    if (key === 'anyOf' && Array.isArray(value)) {
      result.anyOf = value.map(entry => fromGeminiSchema(asSchema(entry)));
      continue;
    }

    result[key] = value;
  }

  return result;
}

/** Projects a JSON Schema onto the subset Gemini accepts, reporting every dropped keyword. */
export function toGeminiSchema(schema: JsonSchema, warnings: string[], path = 'parameters'): JsonSchema {
  const result: JsonSchema = {};

  for (const [key, value] of Object.entries(schema)) {
    if (key === 'type') {
      const types = (Array.isArray(value) ? value : [value]).filter(entry => typeof entry === 'string') as string[];
      const concrete = types.filter(entry => entry !== 'null');

      result.type = (concrete[0] ?? 'string').toUpperCase();

      if (types.length > concrete.length) {
        result.nullable = true;
      }
      if (concrete.length > 1) {
        warnings.push(`${path}.type: Gemini keeps only "${concrete[0]}", dropped ${concrete.slice(1).map(entry => `"${entry}"`).join(', ')}`);
      }
      continue;
    }

    if (key === 'const') {
      result.enum = [value];
      continue;
    }

    if (!geminiSchemaKeys.has(key)) {
      warnings.push(`${path}.${key}: not supported by Gemini, dropped`);
      continue;
    }

    if (key === 'properties') {
      const properties: JsonSchema = {};
      for (const [property, child] of Object.entries(asRecord(value) ?? {})) {
        properties[property] = toGeminiSchema(asSchema(child), warnings, `${path}.${property}`);
      }
      result.properties = properties;
      continue;
    }

    if (key === 'items') {
      result.items = toGeminiSchema(asSchema(value), warnings, `${path}[]`);
      continue;
    }

    if (key === 'anyOf' && Array.isArray(value)) {
      result.anyOf = value.map((entry, index) => toGeminiSchema(asSchema(entry), warnings, `${path}.anyOf[${index}]`));
      continue;
    }

    result[key] = value;
  }

  return result;
}
