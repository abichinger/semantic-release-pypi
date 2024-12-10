import { describe, expect, test } from 'vitest';
import {
  bDistPackage,
  createVenv,
  installPackages,
  prepare,
  sDistPackage,
  setVersionPy,
  setVersionToml,
} from '../lib/prepare.js';
import { pipe, spawn } from '../lib/util.js';
import { assertPackage } from '../lib/verify.js';
import { genPackage, OutputAnalyzer } from './util.js';

describe('prepare: build functions', () => {
  const testCases = [
    {
      name: 'setup.py',
      useLegacyInterface: true,
    },
    {
      name: 'pyproject.toml',
      useLegacyInterface: false,
    },
  ];

  for (const t of testCases) {
    test(
      t.name,
      async () => {
        const { config, context } = genPackage({
          legacyInterface: t.useLegacyInterface,
        });
        await expect(
          sDistPackage(config.srcDir, config.distDir, pipe(context)),
        ).resolves.toBe(undefined);
        await expect(
          bDistPackage(config.srcDir, config.distDir, pipe(context)),
        ).resolves.toBe(undefined);
      },
      60000,
    );
  }
});

test('prepare: setVersionPy', async () => {
  const { config } = genPackage({
    legacyInterface: true,
  });
  await expect(setVersionPy(config.setupPath, '2.0.0')).resolves.toBe(
    undefined,
  );
});

test('prepare: setVersionToml', async () => {
  const { config, context } = genPackage({
    legacyInterface: false,
  });
  await expect(
    setVersionToml(config.srcDir, '2.0.0', pipe(context)),
  ).resolves.toBe(undefined);
});

test('prepare: versionCmd', async () => {
  const { pluginConfig, context } = genPackage({
    legacyInterface: false,
    config: {
      versionCmd: 'echo Next version: ${version}',
    },
  });

  const outputAnalyzer = new OutputAnalyzer({
    executed: ['Next version: 1.0.0'],
  });
  context.stdout = outputAnalyzer.stream;

  await prepare(pluginConfig, context);
  expect(outputAnalyzer.res.executed).toBe(true);
}, 60000);

describe('prepare: installPackages', () => {
  const tests = [
    { name: 'system', opt: async () => ({}) },
    {
      name: 'virtual environment',
      opt: async () => createVenv('.tmp/.testenv-1'),
    },
  ];

  for (const { name, opt } of tests) {
    test(
      name,
      async () => {
        const pkg = 'requests';
        const options = await opt();

        await spawn('pip3', ['uninstall', '-y', pkg], {
          ...options,
        });
        await expect(assertPackage(pkg, options)).rejects.toThrow();
        await installPackages([pkg], options);
        await expect(assertPackage(pkg, options)).resolves.toBe(undefined);
      },
      60000,
    );
  }
});

test('prepare: createVenv', async () => {
  const options = await createVenv('.tmp/.testenv-2');
  const pythonPath = await spawn('which', ['python3'], options);
  expect(pythonPath.stdout).toContain('.tmp/.testenv-2/bin/python3');
});
