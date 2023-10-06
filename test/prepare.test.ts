import execa from 'execa';
import {
  bDistPackage,
  installPackages,
  sDistPackage,
  setVersionPy,
  setVersionToml,
} from '../lib/prepare';
import { assertPackage } from '../lib/verify';
import { genPackage, genPluginArgs } from './util';

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
          sDistPackage(config.srcDir, config.distDir, context),
        ).resolves.toBe(undefined);
        await expect(
          bDistPackage(config.srcDir, config.distDir, context),
        ).resolves.toBe(undefined);
      },
      15000,
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
  await expect(setVersionToml(config.srcDir, '2.0.0', context)).resolves.toBe(
    undefined,
  );
});

test('prepare: installPackages', async () => {
  const { context } = genPluginArgs({});
  const name = 'requests';

  await execa('pip3', ['uninstall', '-y', name], {
    stdout: process.stdout,
    stderr: process.stderr,
  });
  await expect(assertPackage(name)).rejects.toThrow();
  await installPackages([name], context);
  await expect(assertPackage(name)).resolves.toBe(undefined);
}, 30000);
