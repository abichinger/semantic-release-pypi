import execa, { ExecaReturnBase } from 'execa';
import FormData from 'form-data';
import fs from 'fs';
import got from 'got';
import path from 'path';
import { Context } from './@types/semantic-release';
import { DefaultConfig } from './default-options';
import { PluginConfig } from './types';

function assertEnvVar(name: string) {
  if (!process.env[name]) {
    throw new Error(`Environment variable ${name} is not set`);
  }
}

async function assertExitCode(
  executable: string,
  args: string[] = [],
  exitCode = 0,
) {
  let res: ExecaReturnBase<string>;
  try {
    res = await execa(executable, args);
  } catch (err) {
    res = err as ExecaReturnBase<string>;
  }
  if (res.exitCode != exitCode) {
    throw Error(
      `command: ${res.command}, exit code: ${res.exitCode}, expected: ${exitCode}`,
    );
  }
}

async function assertPackage(name: string) {
  try {
    await assertExitCode('pip3', ['show', name], 0);
  } catch (err) {
    throw Error(`Package ${name} is not installed`);
  }
}

async function verifySetupPy(setupPy: string) {
  try {
    await execa(
      'python3',
      [path.resolve(__dirname, 'verifySetup.py'), path.basename(setupPy)],
      { cwd: path.dirname(setupPy) },
    );
  } catch (err: any) {
    throw Error(err.stderr ?? err);
  }
}

async function verifyAuth(repoUrl: string, username: string, token: string) {
  const form = new FormData();
  form.append(':action', 'file_upload');

  const basicAuth = Buffer.from(`${username}:${token}`).toString('base64');
  const headers = {
    Authorization: `Basic ${basicAuth}`,
  };
  try {
    await got(repoUrl, {
      method: 'post',
      headers: Object.assign(headers, form.getHeaders()),
      body: form,
    });
  } catch (err: any) {
    if (err.response && err.response.statusCode == 403) {
      throw err;
    }
  }
}

async function verify(pluginConfig: PluginConfig, { logger }: Context) {
  const { setupPy, pypiPublish, repoUrl } = new DefaultConfig(pluginConfig);

  logger.log('Checking if build is installed');
  await assertPackage('build');

  if (pypiPublish !== false) {
    const username = process.env['PYPI_USERNAME']
      ? process.env['PYPI_USERNAME']
      : '__token__';
    const token = process.env['PYPI_TOKEN'];
    const repo = process.env['PYPI_REPO_URL'] ?? repoUrl;

    assertEnvVar('PYPI_TOKEN');

    logger.log('Checking if twine is installed');
    await assertPackage('twine');

    logger.log(`Verify authentication for ${username}@${repo}`);
    await verifyAuth(repo, username, token);
  }

  if (!fs.existsSync(setupPy)) {
    throw Error(`setup.py not found, path: ${setupPy}`);
  }

  logger.log('Verify that version is not set in setup.py');
  await verifySetupPy(setupPy);
}

export {
  assertEnvVar,
  assertExitCode,
  assertPackage,
  verify,
  verifyAuth,
  verifySetupPy,
};
