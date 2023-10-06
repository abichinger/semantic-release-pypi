import fs from 'fs';
import got from 'got';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Context } from '../lib/@types/semantic-release';
import { DefaultConfig } from '../lib/default-options';
import { PluginConfig } from '../lib/types';

class BuildInterface {
  name: string;
  version: string;

  constructor(name: string = 'example_package', version: string = '0.0.1') {
    this.name = name;
    this.version = version;
  }

  public toString(useLegacy: boolean): string {
    return useLegacy ? this.setup : this.pyproject;
  }

  get pyproject() {
    return `
[project]
name = "${this.name}"
version = "${this.version}"
`;
  }

  get setup() {
    return `
from setuptools import setup
setup(
  name='${this.name}',
)
`;
  }
}

interface PackageOptions {
  legacyInterface?: boolean;
  config?: PluginConfig;
  content?: string;
  version?: string;
}

function genPackage(options: PackageOptions) {
  const args = genPluginArgs(options.config ?? {});
  const { config, packageName } = args;
  const buildFile = options.legacyInterface
    ? config.setupPath
    : config.pyprojectPath;

  const content =
    options.content ??
    new BuildInterface(packageName, options.version).toString(
      options.legacyInterface ?? false,
    );

  const dir = path.dirname(buildFile);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(buildFile, content);

  return args;
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
function genPluginArgs(config: PluginConfig) {
  const packageName = `semantic-release-pypi-test-` + uuidv4();

  const pluginConfig: PluginConfig = {
    srcDir: config.srcDir ?? `.tmp/${packageName}`,
    distDir: config.distDir ?? `.tmp/${packageName}/dist`,
    repoUrl: config.repoUrl ?? 'https://test.pypi.org/legacy/',
    pypiPublish: config.pypiPublish,
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

  return {
    config: new DefaultConfig(pluginConfig),
    pluginConfig,
    context,
    packageName,
  };
}

export { BuildInterface, genPackage, genPluginArgs, hasPackage };
