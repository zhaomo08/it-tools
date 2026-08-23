#!/usr/bin/env node
// Reports upstream pull requests that add a tool this fork does not have yet.
// Upstream merges almost nothing these days, so the interesting work lives in open PRs.
import { execFile } from 'node:child_process';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const cachePath = join(rootDir, 'scripts', '.upstream-tools-cache.json');

const UPSTREAM = 'CorentinTh/it-tools';
const TOOL_TITLE = /new tool|add .*tool|feat\(new/i;

/** Tool directory names a PR's changed files introduce, e.g. src/tools/json-diff/index.ts -> json-diff */
export function toolNamesFromFiles(files) {
  const names = new Set();

  for (const path of files) {
    const match = /(?:^|\/)src\/tools\/([^/]+)\//.exec(path);
    if (match && !['llm-shared', 'index.ts'].includes(match[1])) {
      names.add(match[1]);
    }
  }

  return [...names].sort();
}

async function gh(args) {
  const { stdout } = await run('gh', args, { maxBuffer: 32 * 1024 * 1024 });
  return JSON.parse(stdout);
}

async function readCache() {
  try {
    return JSON.parse(await readFile(cachePath, 'utf8'));
  }
  catch {
    return {};
  }
}

async function localToolNames() {
  const entries = await readdir(join(rootDir, 'src', 'tools'), { withFileTypes: true });
  return new Set(entries.filter(entry => entry.isDirectory()).map(entry => entry.name));
}

async function main() {
  const mine = await localToolNames();
  const cache = await readCache();

  const prs = await gh(['pr', 'list', '--repo', UPSTREAM, '--state', 'open', '--limit', '400',
    '--json', 'number,title,updatedAt,mergeable,url']);
  const candidates = prs.filter(pr => TOOL_TITLE.test(pr.title));

  console.log(`${prs.length} open PRs upstream, ${candidates.length} look like they add a tool.`);

  const rows = [];
  let fetched = 0;

  for (const pr of candidates) {
    const cached = cache[pr.number];
    let tools = cached?.updatedAt === pr.updatedAt ? cached.tools : null;

    if (!tools) {
      // Only PRs whose files we have never seen (or that changed) cost an API call.
      const files = await gh(['pr', 'view', String(pr.number), '--repo', UPSTREAM, '--json', 'files']);
      tools = toolNamesFromFiles(files.files.map(file => file.path));
      cache[pr.number] = { updatedAt: pr.updatedAt, tools };
      fetched += 1;
      process.stderr.write(`\rinspecting PRs… ${fetched}`);
    }

    const missing = tools.filter(name => !mine.has(name));
    if (missing.length > 0) {
      rows.push({ ...pr, missing });
    }
  }

  await writeFile(cachePath, JSON.stringify(cache, null, 2));
  process.stderr.write(fetched > 0 ? '\r'.padEnd(30) + '\r' : '');

  rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  console.log(`\n${rows.length} PRs add ${new Set(rows.flatMap(row => row.missing)).size} tools you do not have:\n`);

  for (const row of rows) {
    const flag = row.mergeable === 'MERGEABLE' ? 'clean   ' : 'conflict';
    console.log(`  #${String(row.number).padEnd(5)} ${row.updatedAt.slice(0, 10)}  ${flag}  ${row.missing.join(', ')}`);
    console.log(`         ${row.title}`);
    console.log(`         ${row.url}\n`);
  }

  console.log(`Cache: ${cachePath} (delete it to re-inspect every PR)`);
}

if (process.argv.includes('--self-check')) {
  const { strict: assert } = await import('node:assert');

  assert.deepEqual(toolNamesFromFiles(['src/tools/json-diff/index.ts', 'src/tools/json-diff/a.vue']), ['json-diff']);
  assert.deepEqual(toolNamesFromFiles(['apps/web/src/tools/hex/index.ts']), ['hex'], 'monorepo layouts still match');
  assert.deepEqual(toolNamesFromFiles(['src/tools/index.ts', 'locales/en.yml']), [], 'registry and locale edits are not tools');
  assert.deepEqual(toolNamesFromFiles(['src/tools/llm-shared/calculators.ts']), [], 'shared helpers are not tools');
  assert.deepEqual(toolNamesFromFiles(['src/tools/b/i.ts', 'src/tools/a/i.ts']), ['a', 'b'], 'sorted and deduplicated');

  console.log('self-check ok');
}
else {
  await main();
}
