import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bundledFonts, cdnFontPath, fontPathFor } from './ascii-text-drawer.fonts';

describe('ascii-text-drawer fonts', () => {
  it('lists exactly the fonts that ship in public/figlet-fonts', () => {
    const shipped = readdirSync(new URL('../../../public/figlet-fonts', import.meta.url))
      .filter(file => file.endsWith('.flf'))
      .map(file => file.replace(/\.flf$/, ''))
      .sort();

    expect([...bundledFonts].sort()).toEqual(shipped);
  });

  it('serves a bundled font from the app and anything else from the CDN', () => {
    expect(fontPathFor('Standard')).not.toBe(cdnFontPath);
    expect(fontPathFor('Bubble')).toBe(cdnFontPath);
  });

  it('never ends a path in a slash, which figlet would turn into a double slash', () => {
    expect(fontPathFor('Standard')).not.toMatch(/\/$/);
    expect(fontPathFor('Bubble')).not.toMatch(/\/$/);
  });
});
