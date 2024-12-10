import { expect, test } from 'vitest';
import { DefaultConfig } from '../lib/default-options.js';
import { normalizeVersion } from '../lib/util.js';

test('test DefaultConfig', async () => {
  expect(new DefaultConfig({}).distDir).toBe('dist');
  expect(new DefaultConfig({}).srcDir).toBe('.');
  expect(new DefaultConfig({}).setupPath).toBe('setup.py');
  expect(new DefaultConfig({}).repoUrl).toBe('https://upload.pypi.org/legacy/');
  expect(new DefaultConfig({ distDir: 'mydist' }).distDir).toBe('mydist');
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
