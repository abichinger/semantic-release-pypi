import { Options } from 'execa';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { Context } from './@types/semantic-release/index.js';
import { DefaultConfig } from './default-options.js';
import { PluginConfig } from './types.js';
import { normalizeVersion, pipe, setopt, spawn } from './util.js';
import { assertExitCode, isLegacyBuildInterface } from './verify.js';

async function setVersionPy(setupPy: string, version: string) {
  try {
    await setopt(setupPy, 'metadata', 'version', version);
  } catch (err) {
    throw Error(`failed to set release version ${version}\n${err}`);
  }
}

async function setVersionToml(
  srcDir: string,
  version: string,
  options?: Options,
) {
  await assertExitCode(
    'python3',
    [path.resolve(__dirname, 'py/set_version.py'), '-v', version, srcDir],
    options,
    0,
  );
}

async function sDistPackage(
  srcDir: string,
  distDir: string,
  options?: Options,
) {
  await spawn('python3', ['-m', 'build', '--sdist', '--outdir', distDir], {
    ...options,
    cwd: srcDir,
  });
}

async function bDistPackage(
  srcDir: string,
  distDir: string,
  options?: Options,
) {
  try {
    await spawn('python3', ['-m', 'build', '--wheel', '--outdir', distDir], {
      ...options,
      cwd: srcDir,
    });
  } catch (err) {
    throw Error(`failed to build wheel`);
  }
}

async function installPackages(packages: string[], options?: Options) {
  await spawn('pip3', ['install', ...packages], options);
}

async function createVenv(envDir: string, options?: Options): Promise<Options> {
  const envPath = path.resolve(envDir, 'bin');
  if (!fs.existsSync(envPath)) {
    await spawn('python3', ['-m', 'venv', envDir], options);
  }
  if (os.platform() == 'win32') {
    return {
      ...options,
      env: {
        Path: envPath + ';' + process.env.Path,
      },
    };
  }
  return {
    ...options,
    env: {
      PATH: envPath + ':' + process.env.PATH,
    },
  };
}

async function prepare(pluginConfig: PluginConfig, context: Context) {
  const { logger, nextRelease } = context;
  const { srcDir, setupPath, distDir, envDir, installDeps } = new DefaultConfig(
    pluginConfig,
  );

  if (nextRelease === undefined) {
    throw new Error('nextRelease is undefined');
  }

  let execaOptions: Options = pipe(context);

  if (envDir) {
    logger.log(`Creating virtual environment ${envDir}`);
    execaOptions = await createVenv(envDir, execaOptions);
  }

  if (installDeps) {
    const requirementsFile = path.resolve(__dirname, 'py/requirements.txt');
    const requirements = fs
      .readFileSync(requirementsFile, 'utf8')
      .split('\n')
      .filter((value) => value.length >= 0);

    logger.log(
      `Installing required python packages (${requirements.join(', ')})`,
    );
    await installPackages(requirements, execaOptions);
  }

  const version = await normalizeVersion(nextRelease.version, execaOptions);

  if (isLegacyBuildInterface(srcDir)) {
    logger.log(`Set version to ${version} (setup.cfg)`);
    await setVersionPy(setupPath, version);
  } else {
    await setVersionToml(srcDir, version, execaOptions);
  }

  logger.log(`Build source archive`);
  await sDistPackage(srcDir, distDir, execaOptions);
  logger.log(`Build wheel`);
  await bDistPackage(srcDir, distDir, execaOptions);
}

export {
  bDistPackage,
  createVenv,
  installPackages,
  prepare,
  sDistPackage,
  setVersionPy,
  setVersionToml,
};
