#!/usr/bin/env node
/**
 * Minimal Test Runner for .mjs tests in the tests directory
 * - Discovers files matching *.test.mjs
 * - Imports each file and runs exported async functions that start with "test"
 * - Reports pass/fail summary and proper exit code
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const TEST_DIR = path.resolve(process.cwd(), 'tests');

function findTestFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findTestFiles(fullPath));
    } else if (entry.isFile() && /\.test\.mjs$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

async function run() {
  const startAll = Date.now();
  const files = findTestFiles(TEST_DIR);

  if (files.length === 0) {
    console.warn('[test-runner] No test files found in tests directory.');
    process.exit(0);
  }

  let passed = 0;
  let failed = 0;
  const failures = [];

  console.log(`[test-runner] Discovered ${files.length} test file(s).`);

  for (const file of files) {
    const startFile = Date.now();
    console.log(`\n[test-file] ${path.relative(process.cwd(), file)}`);
    try {
      const mod = await import(pathToFileURL(file).href);
      const exportNames = Object.keys(mod).filter((k) => typeof mod[k] === 'function' && k.startsWith('test'));
      if (exportNames.length === 0) {
        console.log('  (no exported test functions found)');
        continue;
      }

      for (const name of exportNames) {
        const tStart = Date.now();
        try {
          const fn = mod[name];
          const maybePromise = fn.length === 0 ? fn() : fn({});
          await maybePromise;
          const ms = Date.now() - tStart;
          console.log(`  ✓ ${name} (${ms} ms)`);
          passed++;
        } catch (err) {
          const ms = Date.now() - tStart;
          console.error(`  ✗ ${name} (${ms} ms)`);
          console.error('    ', err && err.stack ? err.stack : err);
          failed++;
          failures.push({ file, name, error: err });
        }
      }
    } catch (e) {
      console.error(`  ✗ Failed to import ${file}`);
      console.error('    ', e && e.stack ? e.stack : e);
      failed++;
      failures.push({ file, name: '(import)', error: e });
    } finally {
      const msFile = Date.now() - startFile;
      console.log(`[end-file] ${path.basename(file)} (${msFile} ms)`);
    }
  }

  const totalMs = Date.now() - startAll;
  console.log(`\n[test-runner] Completed in ${totalMs} ms. Passed: ${passed}, Failed: ${failed}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

run().catch((e) => {
  console.error('[test-runner] Uncaught error:', e && e.stack ? e.stack : e);
  process.exit(1);
});