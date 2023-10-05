import fs from 'fs';
import got from 'got';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Context } from '../lib/@types/semantic-release';
import { PluginConfig } from '../lib/types';
import { setopt } from '../lib/util';

const defaultSetupPy = `
from setuptools import setup
setup()
`;

const defaultPyproject = `
[project]
name = "example_package"
version = "0.0.1"
`;

async function genPackage(buildFile: string, name?: string, content?: string) {
  const isLegacyInterface = path.basename(buildFile).startsWith('setup');
  content = content ?? (isLegacyInterface ? defaultSetupPy : defaultPyproject);

  const dir = path.dirname(buildFile);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(buildFile, content);

  if (isLegacyInterface) {
    const options = [['name', name ?? 'example_package']];

    for (const [option, value] of options) {
      await setopt(buildFile, 'metadata', option, value);
    }
  }
}

async function hasPackage(
  repoUrl: string,
  packageName: string,
  version: string,
) {
  const url = `${repoUrl}/pypi/${packageName}/${version}/json`;
  try {
    await got.get(url);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 *
 * @param {string} setupPy path of setup.py
 * @returns {{config: object, context: object, packageName: string}}
 */
function genPluginArgs(setupPy: string, name = 'integration') {
  const packageName = `semantic-release-pypi-${name}-test-` + uuidv4();

  const config: PluginConfig = {
    setupPy: setupPy,
    repoUrl: 'https://test.pypi.org/legacy/',
    pypiPublish: true,
  };

  const context: Context = {
    commits: [],
    branch: {
      name: 'master',
      channel: '',
      prerelease: false,
      range: '',
    },
    env: {},
    lastRelease: undefined,
    nextRelease: {
      name: 'v1.0.0',
      version: '1.0.0',
      type: 'minor',
      channel: '',
      gitTag: 'v1.0.0',
      gitHead: 'h1',
      notes: '',
    },
    /* eslint-disable @typescript-eslint/no-unused-vars */
    logger: {
      log: jest.fn(),
      await: function (...message: any[]): void {
        throw new Error('Function not implemented.');
      },
      complete: function (...message: any[]): void {
        throw new Error('Function not implemented.');
      },
      debug: function (...message: any[]): void {
        throw new Error('Function not implemented.');
      },
      error: function (...message: any[]): void {
        throw new Error('Function not implemented.');
      },
      fatal: function (...message: any[]): void {
        throw new Error('Function not implemented.');
      },
      fav: function (...message: any[]): void {
        throw new Error('Function not implemented.');
      },
      info: function (...message: any[]): void {
        throw new Error('Function not implemented.');
      },
      note: function (...message: any[]): void {
        throw new Error('Function not implemented.');
      },
      pause: function (...message: any[]): void {
        throw new Error('Function not implemented.');
      },
      pending: function (...message: any[]): void {
        throw new Error('Function not implemented.');
      },
      star: function (...message: any[]): void {
        throw new Error('Function not implemented.');
      },
      start: function (...message: any[]): void {
        throw new Error('Function not implemented.');
      },
      success: function (...message: any[]): void {
        throw new Error('Function not implemented.');
      },
      wait: function (...message: any[]): void {
        throw new Error('Function not implemented.');
      },
      warn: function (...message: any[]): void {
        throw new Error('Function not implemented.');
      },
      watch: function (...message: any[]): void {
        throw new Error('Function not implemented.');
      },
    },
    stdout: process.stdout,
    stderr: process.stderr,
  };

  return { config, context, packageName };
}

export { genPackage, genPluginArgs, hasPackage };
