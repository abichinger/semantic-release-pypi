import { Options, ResultPromise } from 'execa';
import type { Context } from './@types/semantic-release/index.js';
import { DefaultConfig } from './default-options.js';
import { createVenv } from './prepare.js';
import { PluginConfig } from './types.js';
import { pipe, spawn } from './util.js';

function publishPackage(
  srcDir: string,
  distDir: string,
  repoUrl: string,
  repoUsername: string,
  repoToken: string,
  gpgSign: boolean,
  gpgIdentity?: string,
  options?: Options,
): ResultPromise {
  const signArgs = gpgSign ? ['--sign'] : [];
  if (gpgIdentity) {
    signArgs.push('--identity', gpgIdentity);
  }

  return spawn(
    'python3',
    [
      '-m',
      'twine',
      'upload',
      '--repository-url',
      repoUrl,
      '--non-interactive',
      '--verbose',
      ...signArgs,
      `${distDir}/*`,
    ].filter((arg) => arg !== null),
    {
      ...options,
      cwd: srcDir,
      env: {
        ...options?.env,
        TWINE_USERNAME: repoUsername,
        TWINE_PASSWORD: repoToken,
      },
    },
  );
}

async function publish(pluginConfig: PluginConfig, context: Context) {
  const { logger } = context;
  const {
    srcDir,
    distDir,
    pypiPublish,
    gpgSign,
    gpgIdentity,
    repoUrl,
    repoUsername,
    repoToken,
    envDir,
  } = new DefaultConfig(pluginConfig);

  let options = pipe(context);
  if (envDir) {
    options = await createVenv(envDir, options);
  }

  if (pypiPublish !== false) {
    logger.log(`Publishing package to ${repoUrl}`);
    const result = publishPackage(
      srcDir,
      distDir,
      process.env['PYPI_REPO_URL'] ?? repoUrl,
      process.env['PYPI_USERNAME'] ?? repoUsername,
      process.env['PYPI_TOKEN'] ?? repoToken,
      gpgSign,
      gpgIdentity,
      options,
    );
    await result;
  } else {
    logger.log('Not publishing package due to requested configuration');
  }
}

export { publish, publishPackage };
