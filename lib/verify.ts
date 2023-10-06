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
  options?: execa.Options,
  exitCode = 0,
  context?: Context,
) {
  let res: ExecaReturnBase<string>;
  try {
    const cp = execa(executable, args, options);
    if (context) {
      cp.stdout?.pipe(context.stdout, { end: false });
      cp.stderr?.pipe(context.stderr, { end: false });
    }
    res = await cp;
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
    await assertExitCode('pip3', ['show', name]);
  } catch (err) {
    throw Error(`Package ${name} is not installed`);
  }
}

async function verifySetupPy(setupPy: string, context?: Context) {
  await assertExitCode(
    'python3',
    [path.resolve(__dirname, 'py/verify_setup.py'), path.basename(setupPy)],
    { cwd: path.dirname(setupPy) },
    0,
    context,
  );
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

function isLegacyBuildInterface(srcDir: string): boolean {
  const pyprojectPath = path.join(srcDir, 'pyproject.toml');
  if (!fs.existsSync(pyprojectPath)) {
    return true;
  }
  return !fs.statSync(pyprojectPath).isFile;
}

async function verify(pluginConfig: PluginConfig, context: Context) {
  const { logger } = context;
  const { srcDir, setupPath, pypiPublish, repoUrl } = new DefaultConfig(
    pluginConfig,
  );

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

  if (isLegacyBuildInterface(srcDir)) {
    logger.log('pyproject.toml not found, using legacy interface (setup.py)');

    if (!fs.existsSync(setupPath)) {
      throw Error(`setup.py not found, path: ${setupPath}`);
    }

    logger.log('Checking if setuptools is installed');
    await assertPackage('setuptools');

    logger.log('Verify that version is not set in setup.py');
    await verifySetupPy(setupPath, context);
  }
}

export {
  assertEnvVar,
  assertExitCode,
  assertPackage,
  isLegacyBuildInterface,
  verify,
  verifyAuth,
  verifySetupPy,
};
