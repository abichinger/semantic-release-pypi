import execa from 'execa';
import fs from 'fs';
import path from 'path';
import type { Context } from './@types/semantic-release';
import { DefaultConfig } from './default-options';
import { PluginConfig } from './types';
import { normalizeVersion, setopt } from './util';
import { assertExitCode, isLegacyBuildInterface } from './verify';

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
  context?: Context,
) {
  await assertExitCode(
    'python3',
    [path.resolve(__dirname, 'py/set_version.py'), '-v', version, srcDir],
    {},
    0,
    context,
  );
}

async function sDistPackage(
  srcDir: string,
  distDir: string,
  context?: Context,
) {
  const cp = execa('python3', ['-m', 'build', '--sdist', '--outdir', distDir], {
    cwd: srcDir,
  });

  if (context) {
    cp.stdout?.pipe(context.stdout, { end: false });
    cp.stderr?.pipe(context.stderr, { end: false });
  }

  await cp;
}

async function bDistPackage(
  srcDir: string,
  distDir: string,
  context?: Context,
) {
  try {
    const cp = execa(
      'python3',
      ['-m', 'build', '--wheel', '--outdir', distDir],
      {
        cwd: srcDir,
      },
    );

    if (context) {
      cp.stdout?.pipe(context.stdout, { end: false });
      cp.stderr?.pipe(context.stderr, { end: false });
    }

    await cp;
  } catch (err) {
    console.log(err);
    throw Error(`failed to build wheel`);
  }
}

async function installPackages(packages: string[], context?: Context) {
  const cp = execa('pip3', ['install', ...packages]);

  if (context) {
    cp.stdout?.pipe(context.stdout, { end: false });
    cp.stderr?.pipe(context.stderr, { end: false });
  }

  await cp;
}

async function prepare(pluginConfig: PluginConfig, context: Context) {
  const { logger, nextRelease } = context;
  const { srcDir, setupPath, distDir } = new DefaultConfig(pluginConfig);

  const requirementsFile = path.resolve(__dirname, 'py/requirements.txt');
  const requirements = fs
    .readFileSync(requirementsFile, 'utf8')
    .split('\n')
    .filter((value) => value.length >= 0);

  logger.log(
    `Installing required python packages (${requirements.join(', ')})`,
  );
  await installPackages(requirements, context);

  const version = await normalizeVersion(nextRelease.version);

  if (isLegacyBuildInterface(srcDir)) {
    logger.log(`Set version to ${version} (setup.cfg)`);
    await setVersionPy(setupPath, version);
  } else {
    await setVersionToml(srcDir, version, context);
  }

  logger.log(`Build source archive`);
  await sDistPackage(srcDir, distDir, context);
  logger.log(`Build wheel`);
  await bDistPackage(srcDir, distDir, context);
}

export {
  bDistPackage,
  installPackages,
  prepare,
  sDistPackage,
  setVersionPy,
  setVersionToml,
};
