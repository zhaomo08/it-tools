import { estimateTokens } from '../llm-shared/calculators';

export interface Chunk {
  index: number
  text: string
  characters: number
  tokens: number
}

export interface ChunkOptions {
  maxCharacters: number
  overlapCharacters: number
  separators?: string[]
}

/** Ordered from the most semantic boundary to the least; the last entry is a hard character cut. */
export const defaultSeparators = ['\n\n', '\n', '。', '！', '？', '. ', '; ', ' ', ''];

function splitRecursively(text: string, maxCharacters: number, separators: string[]): string[] {
  if (text.length <= maxCharacters) {
    return text === '' ? [] : [text];
  }

  const separator = separators.find(candidate => candidate !== '' && text.includes(candidate));

  if (separator === undefined) {
    // ponytail: no boundary left, cut on the character grid
    const pieces: string[] = [];
    for (let offset = 0; offset < text.length; offset += maxCharacters) {
      pieces.push(text.slice(offset, offset + maxCharacters));
    }
    return pieces;
  }

  const remaining = separators.slice(separators.indexOf(separator) + 1);
  const parts = text.split(separator).map((part, index, all) => (index < all.length - 1 ? part + separator : part));
  const merged: string[] = [];

  for (const part of parts) {
    const last = merged[merged.length - 1];

    if (last !== undefined && last.length + part.length <= maxCharacters) {
      merged[merged.length - 1] = last + part;
      continue;
    }

    if (part.length > maxCharacters) {
      merged.push(...splitRecursively(part, maxCharacters, remaining));
      continue;
    }

    merged.push(part);
  }

  return merged.filter(part => part !== '');
}

export function chunkText(text: string, { maxCharacters, overlapCharacters, separators = defaultSeparators }: ChunkOptions): Chunk[] {
  const size = Math.max(1, Math.floor(maxCharacters));
  const overlap = Math.min(Math.max(0, Math.floor(overlapCharacters)), size - 1);
  const pieces = splitRecursively(text.trim(), size, separators);

  return pieces.map((piece, index) => {
    const carried = overlap > 0 && index > 0 ? pieces[index - 1].slice(-overlap) : '';
    const merged = carried + piece;

    return {
      index: index + 1,
      text: merged,
      characters: merged.length,
      tokens: estimateTokens(merged).tokens,
    };
  });
}

export function toJsonl(chunks: Chunk[], source = 'document'): string {
  return chunks
    .map(chunk => JSON.stringify({ id: `${source}-${chunk.index}`, source, chunk: chunk.index, text: chunk.text }))
    .join('\n');
}
