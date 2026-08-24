// Fonts shipped with the app, so the tool keeps working offline and without a
// CDN round trip. The other ~265 figlet fonts are fetched on demand the first
// time they are picked. Keep this in step with public/figlet-fonts — the test
// next to this file fails if the two drift apart.
export const bundledFonts = [
  '3-D',
  'ANSI Shadow',
  'Banner',
  'Big',
  'Block',
  'Bloody',
  'Calvin S',
  'Colossal',
  'Cybermedium',
  'Digital',
  'Doom',
  'Ghost',
  'Graffiti',
  'Isometric1',
  'Larry 3D',
  'Mini',
  'Ogre',
  'Roman',
  'Shadow',
  'Slant',
  'Small',
  'Small Slant',
  'Standard',
  'Star Wars',
];

export const bundledFontPath = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/figlet-fonts`;

// The fonts ship with the figlet package, so this has to track the dependency.
export const cdnFontPath = 'https://unpkg.com/figlet@1.7.0/fonts';

/** figlet appends `/<font>.flf`, so neither path may end in a slash. */
export function fontPathFor(font: string): string {
  return bundledFonts.includes(font) ? bundledFontPath : cdnFontPath;
}
