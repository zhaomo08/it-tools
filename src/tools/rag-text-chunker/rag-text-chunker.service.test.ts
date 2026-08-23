import { describe, expect, it } from 'vitest';
import { chunkText, toJsonl } from './rag-text-chunker.service';

describe('rag-text-chunker', () => {
  it('keeps a short text as a single chunk', () => {
    const chunks = chunkText('Short paragraph.', { maxCharacters: 100, overlapCharacters: 0 });

    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe('Short paragraph.');
    expect(chunks[0].characters).toBe(16);
  });

  it('splits on paragraph boundaries before falling back to smaller separators', () => {
    const text = `${'a'.repeat(30)}\n\n${'b'.repeat(30)}`;
    const chunks = chunkText(text, { maxCharacters: 40, overlapCharacters: 0 });

    expect(chunks).toHaveLength(2);
    expect(chunks[0].text.trim()).toBe('a'.repeat(30));
    expect(chunks[1].text).toBe('b'.repeat(30));
  });

  it('never emits a chunk longer than the limit plus the overlap', () => {
    const chunks = chunkText('word '.repeat(200), { maxCharacters: 120, overlapCharacters: 20 });

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.characters).toBeLessThanOrEqual(140);
    }
  });

  it('hard-cuts text that has no separator at all', () => {
    const chunks = chunkText('x'.repeat(250), { maxCharacters: 100, overlapCharacters: 0 });

    expect(chunks.map(chunk => chunk.characters)).toEqual([100, 100, 50]);
  });

  it('carries the tail of the previous chunk as overlap', () => {
    const chunks = chunkText(`${'a'.repeat(50)}\n\n${'b'.repeat(50)}`, { maxCharacters: 60, overlapCharacters: 10 });

    expect(chunks[1].text.startsWith('aa')).toBe(true);
    expect(chunks[0].text.startsWith('a')).toBe(true);
  });

  it('clamps an overlap that would swallow the whole chunk', () => {
    const chunks = chunkText('x'.repeat(30), { maxCharacters: 10, overlapCharacters: 999 });

    expect(chunks[1].characters).toBe(19);
  });

  it('serializes chunks to embedding-ready JSONL', () => {
    const lines = toJsonl(chunkText('one\n\ntwo', { maxCharacters: 4, overlapCharacters: 0 }), 'faq');

    expect(JSON.parse(lines.split('\n')[0])).toMatchObject({ id: 'faq-1', source: 'faq', chunk: 1 });
  });
});
