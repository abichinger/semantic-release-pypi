import fs from 'fs';
import TOML from 'smol-toml';
import { describe, expect, test } from 'vitest';
import { setVersionPy, setVersionToml } from '../lib/prepare.js';
import { pipe } from '../lib/util.js';
import { genPackage } from './util.js';

test('prepare: setVersionPy', async () => {
  const { config } = genPackage({
    legacyInterface: true,
  });
  await expect(setVersionPy(config.setupPath, '2.0.0')).resolves.toBe(
    undefined,
  );
});

describe('prepare: setVersionToml', async () => {
  const testCases = [
    {
      name: 'version in project',
      section: 'project',
      content: `[project]
version = "0.0.0"`,
    },
    {
      name: 'no version',
      section: 'project',
      content: `[project]
name = "test"`,
    },
    {
      name: 'poetry: version in tool.poetry',
      section: 'tool.poetry',
      content: `[tool.poetry]
version = "0.0.0"`,
    },
    {
      name: 'poetry: version in project',
      section: 'project',
      content: `[project]
version = "0.0.0"

[tool.poetry]
name = "test"

[tool.poetry.dependencies]
python = "^3.7"`,
    },
  ];

  for (const t of testCases) {
    test(
      t.name,
      async () => {
        const { config, context } = genPackage({
          legacyInterface: false,
          content: t.content,
        });
        await expect(
          setVersionToml(config.srcDir, '1.0.0', pipe(context)),
        ).resolves.toBe(undefined);

        const toml = fs.readFileSync(config.pyprojectPath, {
          encoding: 'utf8',
        });
        const pyproject: any = TOML.parse(toml);
        const version = t.section
          .split('.')
          .reduce((acc, key) => acc[key], pyproject).version;

        await expect(version).toBe('1.0.0');
      },
      60000,
    );
  }
});
