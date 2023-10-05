import fs from 'fs';
import path from 'path';
import {
  assertEnvVar,
  assertExitCode,
  assertPackage,
  verify,
  verifyAuth,
  verifySetupPy,
} from '../lib/verify';
import { genPackage, genPluginArgs } from './util';

const setupPy = '.tmp/verify/setup.py';
const packageName = 'semantic-release-pypi-verify-test';

afterAll(async () => {
  fs.rmSync(path.dirname(setupPy), { recursive: true, force: true });
});

test('test assertEnvVar', async () => {
  expect(assertEnvVar('PATH')).toBe(undefined);
  expect(() => assertEnvVar('FOO_BAZ_BAR')).toThrow();
});

test('test assertExitCode', async () => {
  await expect(assertExitCode('node', ['--version'], 0)).resolves.toBe(
    undefined,
  );
  await expect(assertExitCode('node', ['--version'], 1)).rejects.toThrow();

  await expect(assertExitCode('node', ['--ver'], 9)).resolves.toBe(undefined);
  await expect(assertExitCode('node', ['--ver'], 0)).rejects.toThrow();
});

test('test assertPackage', async () => {
  await expect(assertPackage('pip')).resolves.toBe(undefined);
  await expect(assertPackage('foo-bar-baz')).rejects.toThrow();
});

describe('test verifySetupPy', () => {
  const testCases = [
    {
      content: `from setuptools import setup\nsetup()`,
      resolves: true,
    },
    {
      content: `from setuptools import setup\nsetup(version='1.0.0', description="test")`,
      resolves: false,
    },
    {
      content: `# under the terms of the GNU General Public License version 3, or`,
      resolves: true,
    },
    {
      content: `from setuptools import setup\nv='1.0.0'\nsetup(version=v, description="test")`,
      resolves: false,
    },
  ];

  const testfn = async (setupPyContent: string, resolves: boolean) => {
    await genPackage(setupPy, packageName, setupPyContent);
    const promise = verifySetupPy(setupPy);

    if (resolves === false) {
      return expect(promise).rejects.toThrow('version in');
    } else {
      return expect(promise).resolves.toBe(undefined);
    }
  };

  for (const c of testCases) {
    test(c.content, async () => {
      await testfn(c.content, c.resolves);
    });
  }
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

test('test without setup.py', async () => {
  const { config, context } = await genPluginArgs(
    './does-not-exist/setup.py',
    'unknown',
  );
  config.pypiPublish = false;

  const promise = verify(config, context);
  return expect(promise).rejects.toThrow('setup.py not found');
});
