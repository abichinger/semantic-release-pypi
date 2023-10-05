import execa from 'execa';
import path from 'path';
import type { Context } from './@types/semantic-release';
import { DefaultConfig } from './default-options';
import { PluginConfig } from './types';

function publishPackage(
  setupPy: string,
  distDir: string,
  repoUrl: string,
  gpgSign: boolean,
  gpgIdentity: string,
) {
  return execa(
    'python3',
    [
      '-m',
      'twine',
      'upload',
      '--repository-url',
      repoUrl,
      '--non-interactive',
      '--skip-existing',
      '--verbose',
      gpgSign ? '--sign' : null,
      gpgSign && gpgIdentity ? '--identity' : null,
      gpgSign && gpgIdentity ? gpgIdentity : null,
      `${distDir}/*`,
    ].filter((arg) => arg !== null),
    {
      cwd: path.dirname(setupPy),
      env: {
        TWINE_USERNAME: process.env['PYPI_USERNAME']
          ? process.env['PYPI_USERNAME']
          : '__token__',
        TWINE_PASSWORD: process.env['PYPI_TOKEN'],
      },
    },
  );
}

async function publish(
  pluginConfig: PluginConfig,
  { logger, stdout, stderr }: Context,
) {
  const { setupPy, distDir, pypiPublish, gpgSign, gpgIdentity, repoUrl } =
    new DefaultConfig(pluginConfig);

  if (pypiPublish !== false) {
    logger.log(`Publishing package to ${repoUrl}`);
    const result = publishPackage(
      setupPy,
      distDir,
      process.env['PYPI_REPO_URL'] ?? repoUrl,
      gpgSign,
      gpgIdentity,
    );
    result.stdout?.pipe(stdout, { end: false });
    result.stderr?.pipe(stderr, { end: false });
    await result;
  } else {
    logger.log('Not publishing package due to requested configuration');
  }
}

export { publish, publishPackage };
