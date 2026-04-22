import { expect, test } from 'vitest';
import { assertPackage, verifyAuth } from '../../lib/verify.js';

test('test assertPackage', async () => {
  await expect(assertPackage('pip')).resolves.toBe(undefined);
  await expect(assertPackage('foo-bar-baz')).rejects.toThrow();
});

test('test verifyAuth', async () => {
  const repoUrl = 'https://test.pypi.org/legacy/';

  await expect(verifyAuth(repoUrl, '__token__', '12345')).rejects.toThrow();
  if (process.env['TESTPYPI_TOKEN']) {
    await expect(
      verifyAuth(repoUrl, '__token__', process.env['TESTPYPI_TOKEN']),
    ).resolves.toBe(undefined);
  } else {
    console.warn('skipped verifyAuth because TESTPYPI_TOKEN is not set');
  }
});
