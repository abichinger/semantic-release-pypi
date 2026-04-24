import fs from 'fs';
import path from 'path';
import TOML from 'smol-toml';
import { describe, expect, test } from 'vitest';
import { prepare, setVersionPy, setVersionToml } from '../lib/prepare.js';
import { pipe } from '../lib/util.js';
import { genPackage, genPluginArgs } from './util.js';

test('prepare: setVersionPy', async () => {
  const { config } = genPackage({
    legacyInterface: true,
  });
  await expect(setVersionPy(config.setupPath, '2.0.0')).resolves.toBe(
    undefined,
  );

  // Verify the version was actually written to setup.cfg
  const setupCfgPath = path.join(config.srcDir, 'setup.cfg');
  const setupCfg = fs.readFileSync(setupCfgPath, 'utf8');
  expect(setupCfg).toContain('version = 2.0.0');
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

test('prepare: throws immediately when nextRelease is undefined', async () => {
  const { pluginConfig, context } = genPluginArgs({
    pypiPublish: false,
    installDeps: false,
    envDir: false,
  });
  context.nextRelease = undefined;
  await expect(prepare(pluginConfig, context)).rejects.toThrow(
    'nextRelease is undefined',
  );
});
