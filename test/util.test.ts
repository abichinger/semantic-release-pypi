import { describe, expect, test } from 'vitest';
import { DefaultConfig } from '../lib/default-options.js';
import { normalizeVersion } from '../lib/util.js';

describe('DefaultConfig: defaults', () => {
  test('default values', () => {
    const cfg = new DefaultConfig({});

    expect(cfg.srcDir).toBe('.');
    expect(cfg.distDir).toBe('dist');
    expect(cfg.setupPath).toBe('setup.py');
    expect(cfg.pyprojectPath).toBe('pyproject.toml');
    expect(cfg.repoUrl).toBe('https://upload.pypi.org/legacy/');
    expect(cfg.repoUsername).toBe('__token__');
    expect(cfg.repoToken).toBe('');
    expect(cfg.pypiPublish).toBe(true);
    expect(cfg.gpgSign).toBe(false);
    expect(cfg.gpgIdentity).toBeUndefined();
    expect(cfg.envDir).toBe('.venv');
    expect(cfg.installDeps).toBe(true);
    expect(cfg.versionCmd).toBeUndefined();
    expect(cfg.skipIfConflict).toBe(false);
  });
});

describe('DefaultConfig: explicit overrides', () => {
  test('explicit overrides', () => {
    const cfg = new DefaultConfig({
      srcDir: 'src/mypackage',
      distDir: 'mydist',
      repoUrl: 'https://test.pypi.org/legacy/',
      pypiPublish: false,
      gpgSign: true,
      gpgIdentity: 'me@example.com',
      envDir: false,
      installDeps: false,
      versionCmd: 'bump ${version}',
      skipIfConflict: true,
    });

    expect(cfg.srcDir).toBe('src/mypackage');
    expect(cfg.setupPath).toBe('src/mypackage/setup.py');
    expect(cfg.pyprojectPath).toBe('src/mypackage/pyproject.toml');
    expect(cfg.distDir).toBe('mydist');
    expect(cfg.repoUrl).toBe('https://test.pypi.org/legacy/');
    expect(cfg.pypiPublish).toBe(false);
    expect(cfg.gpgSign).toBe(true);
    expect(cfg.gpgIdentity).toBe('me@example.com');
    expect(cfg.envDir).toBe(false);
    expect(cfg.installDeps).toBe(false);
    expect(cfg.versionCmd).toBe('bump ${version}');
    expect(cfg.skipIfConflict).toBe(true);
  });

  test('versionCmd can be an array', () => {
    expect(
      new DefaultConfig({ versionCmd: ['bump', '${version}'] }).versionCmd,
    ).toEqual(['bump', '${version}']);
  });
});

test('test normalizeVersion', async () => {
  await expect(normalizeVersion('1.0.1')).resolves.toBe('1.0.1');

  await expect(normalizeVersion('1.0.1a')).resolves.toBe('1.0.1a0');
  await expect(normalizeVersion('1.0.1alpha')).resolves.toBe('1.0.1a0');
  await expect(normalizeVersion('1.0.1-a')).resolves.toBe('1.0.1a0');
  await expect(normalizeVersion('1.0.1-a1')).resolves.toBe('1.0.1a1');
  await expect(normalizeVersion('1.0.1-alpha')).resolves.toBe('1.0.1a0');
  await expect(normalizeVersion('1.0.1-alpha1')).resolves.toBe('1.0.1a1');
  await expect(normalizeVersion('1.0.1-alpha.1')).resolves.toBe('1.0.1a1');

  await expect(normalizeVersion('1.0.1-b')).resolves.toBe('1.0.1b0');
  await expect(normalizeVersion('1.0.1-beta')).resolves.toBe('1.0.1b0');
  await expect(normalizeVersion('1.0.1-rc')).resolves.toBe('1.0.1rc0');
  await expect(normalizeVersion('1.0.1-pre')).resolves.toBe('1.0.1rc0');
  await expect(normalizeVersion('1.0.1-post')).resolves.toBe('1.0.1.post0');
  await expect(normalizeVersion('1.0.1-dev')).resolves.toBe('1.0.1.dev0');

  await expect(normalizeVersion('1.0.1-next')).rejects.toThrow();
  await expect(normalizeVersion('1.0.1-develop')).rejects.toThrow();

  await expect(normalizeVersion('1 2 3')).rejects.toThrow();
});
