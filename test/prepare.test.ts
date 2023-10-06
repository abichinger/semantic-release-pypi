import {
  bDistPackage,
  sDistPackage,
  setVersionPy,
  setVersionToml,
} from '../lib/prepare';
import { genPackage } from './util';

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
  const { config } = genPackage({
    legacyInterface: false,
  });
  await expect(setVersionToml(config.srcDir, '2.0.0')).resolves.toBe(undefined);
});
