import { describe, expect, it } from 'vitest';
import { buildNestedSamplePayload } from './prompt-variable-extractor.service';

describe('prompt-variable-extractor service', () => {
  it('builds nested JSON payloads from dot-path variables', () => {
    expect(buildNestedSamplePayload([
      'role',
      'product.name',
      'audience.segment',
      'constraints.max_words',
      'timeline.release_date',
    ])).toEqual({
      role: 'Senior Product Marketing Manager',
      product: {
        name: 'example-value',
      },
      audience: {
        segment: 'example-value',
      },
      constraints: {
        max_words: '120',
      },
      timeline: {
        release_date: '2026-06-15',
      },
    });
  });
});
