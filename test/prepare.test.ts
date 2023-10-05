import fs from 'fs';
import path from 'path';
import { bDistPackage, sDistPackage, setReleaseVersion } from '../lib/prepare';
import { genPackage, genPluginArgs } from './util';

const version = '1.0.1';
const setupPy = '.tmp/prepare/setup.py';
const distDir = 'dist';
const packageName = 'semantic-release-pypi-prepare-test';

beforeAll(async () => {
  await genPackage(setupPy, packageName);
});

afterAll(async () => {
  fs.rmSync('.tmp/prepare', { recursive: true, force: true });
});

describe('prepare: build functions', () => {
  const testCases = [
    {
      name: 'setup.py',
      buildFile: '.tmp/prepare/setup-example/setup.py',
    },
    {
      name: 'pyproject.toml',
      buildFile: '.tmp/prepare/setup-pyproject/pyproject.toml',
    },
  ];

  for (const t of testCases) {
    test(
      t.name,
      async () => {
        const { context } = genPluginArgs('');

        const srcDir = path.dirname(t.buildFile);

        await genPackage(t.buildFile);
        await expect(sDistPackage(srcDir, distDir, context)).resolves.toBe(
          undefined,
        );
        await expect(bDistPackage(srcDir, distDir, context)).resolves.toBe(
          undefined,
        );
      },
      15000,
    );
  }
});

test('prepare: setReleaseVersion', async () => {
  await expect(setReleaseVersion(setupPy, version)).resolves.toBe(undefined);
});
