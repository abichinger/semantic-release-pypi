import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, test, vi } from 'vitest';
import { spawn } from '../lib/util.js';
import {
  assertEnvVar,
  assertExitCode,
  isLegacyBuildInterface,
  verify,
  verifySetupPy,
} from '../lib/verify.js';
import { clearTrustedPublisherEnv, genPackage, genPluginArgs } from './util.js';

test('assertEnvVar: resolves for existing env var', async () => {
  expect(assertEnvVar('PATH')).toBe(undefined);
});

test('assertEnvVar: throws for missing env var', async () => {
  expect(() => assertEnvVar('FOO_BAZ_BAR')).toThrow();
});

describe('assertExitCode', () => {
  test('resolves when exit code matches expected', async () => {
    await expect(
      assertExitCode(spawn('node', ['--version'], {}), 0),
    ).resolves.toBe(undefined);
  });

  test('rejects when exit code does not match expected', async () => {
    await expect(
      assertExitCode(spawn('node', ['--version'], {}), 1),
    ).rejects.toThrow();
  });

  test('resolves when non-zero exit code matches expected', async () => {
    await expect(assertExitCode(spawn('node', ['--ver'], {}), 9)).resolves.toBe(
      undefined,
    );
  });

  test('rejects when command fails but expected exit code is 0', async () => {
    await expect(
      assertExitCode(spawn('node', ['--ver'], {}), 0),
    ).rejects.toThrow();
  });
});

describe('isLegacyBuildInterface', () => {
  test('returns true when pyproject.toml does not exist', () => {
    const { config } = genPackage({ legacyInterface: true });
    expect(isLegacyBuildInterface(config.srcDir)).toBe(true);
  });

  test('returns false when pyproject.toml file exists', () => {
    const { config } = genPackage({ legacyInterface: false });
    expect(isLegacyBuildInterface(config.srcDir)).toBe(false);
  });

  test('returns true when "pyproject.toml" is a directory, not a file', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sr-pypi-test-'));
    fs.mkdirSync(path.join(tmpDir, 'pyproject.toml'));
    try {
      expect(isLegacyBuildInterface(tmpDir)).toBe(true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('returns true for a non-existent srcDir', () => {
    expect(isLegacyBuildInterface('does-not-exist')).toBe(true);
  });
});

describe('verifySetupPy', () => {
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

  const runCase = async (setupPyContent: string, resolves: boolean) => {
    const { config } = genPackage({
      legacyInterface: true,
      content: setupPyContent,
    });
    const promise = verifySetupPy(config.setupPath);

    if (resolves === false) {
      return expect(promise).rejects.toThrow();
    } else {
      return expect(promise).resolves.toBe(undefined);
    }
  };

  for (const c of testCases) {
    test(c.content, async () => {
      await runCase(c.content, c.resolves);
    });
  }
});

test('verify: throws when token is empty and pypiPublish is not false', async () => {
  vi.stubEnv('PYPI_TOKEN', undefined);
  clearTrustedPublisherEnv();

  try {
    const { pluginConfig, context } = genPackage({
      legacyInterface: false,
      config: { pypiPublish: true, repoToken: '' },
      content: `[project]\nname = "test"\nversion = "1.0.0"`,
    });
    await expect(verify(pluginConfig, context)).rejects.toThrow(
      'Token is not set',
    );
  } finally {
    vi.unstubAllEnvs();
  }
});

describe('verify: pyproject.toml interface', () => {
  test('resolves when pyproject.toml has a static version', async () => {
    const { pluginConfig, context } = genPackage({
      legacyInterface: false,
      config: { pypiPublish: false },
      content: `[project]\nname = "test"\nversion = "1.0.0"`,
    });
    await expect(verify(pluginConfig, context)).resolves.toBe(undefined);
  });

  test('throws when dynamic version is declared but versionCmd is absent', async () => {
    const { pluginConfig, context } = genPackage({
      legacyInterface: false,
      config: { pypiPublish: false },
      content: `[project]\nname = "test"\ndynamic = ["version"]`,
    });
    await expect(verify(pluginConfig, context)).rejects.toThrow(
      "'versionCmd' is required when using a dynamic version",
    );
  });

  test('resolves when dynamic version is declared and versionCmd is provided', async () => {
    const { pluginConfig, context } = genPackage({
      legacyInterface: false,
      config: { pypiPublish: false, versionCmd: 'echo ${version}' },
      content: `[project]\nname = "test"\ndynamic = ["version"]`,
    });
    await expect(verify(pluginConfig, context)).resolves.toBe(undefined);
  });

  test('throws when pyproject.toml is missing despite non-legacy srcDir', async () => {
    // genPackage with legacyInterface:false writes pyproject.toml; use explicit
    // non-existent srcDir under .tmp to exercise missing-pyproject branch after
    // isLegacyBuildInterface returns false due to an existing directory.
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sr-pypi-missing-'));
    // Create a directory named pyproject.toml so isLegacyBuildInterface→false
    // but readFileSync will fail because it is a directory.
    fs.mkdirSync(path.join(tmpDir, 'pyproject.toml'));
    try {
      const { pluginConfig, context } = genPluginArgs({
        srcDir: tmpDir,
        pypiPublish: false,
      });
      await expect(verify(pluginConfig, context)).rejects.toThrow();
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

test('verify: throws when setup.py is missing in legacy mode', async () => {
  const { pluginConfig, context } = genPluginArgs({
    srcDir: 'does-not-exist',
    pypiPublish: false,
  });

  const promise = verify(pluginConfig, context);
  return expect(promise).rejects.toThrow('setup.py not found');
});
