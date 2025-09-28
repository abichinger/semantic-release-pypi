import {
  ExecaError,
  Result as ExecaResult,
  Options,
  ResultPromise,
} from 'execa';
import FormData from 'form-data';
import fs from 'fs';
import got from 'got';
import path from 'path';
import TOML from 'smol-toml';
import { Context } from './@types/semantic-release/index.js';
import { DefaultConfig } from './default-options.js';
import { PluginConfig } from './types.js';
import { __dirname, pipe, spawn } from './util.js';

function assertEnvVar(name: string) {
  if (!process.env[name]) {
    throw new Error(`Environment variable ${name} is not set`);
  }
}

async function assertExitCode(subprocess: ResultPromise, exitCode = 0) {
  let res: ExecaError | ExecaResult;
  try {
    res = await subprocess;
  } catch (err) {
    res = err as ExecaError;
  }
  if (res.exitCode != exitCode) {
    throw Error(
      res.stderr +
        `\ncommand: ${res.command}, exit code: ${res.exitCode}, expected: ${exitCode}`,
    );
  }
}

async function assertPackage(name: string, options?: Options) {
  try {
    await assertExitCode(spawn('pip3', ['show', name], options));
  } catch (err) {
    throw Error(`Package ${name} is not installed`);
  }
}

async function verifySetupPy(setupPy: string, options?: Options) {
  await assertExitCode(
    spawn(
      'python3',
      [path.resolve(__dirname, 'py/verify_setup.py'), path.basename(setupPy)],
      { ...options, cwd: path.dirname(setupPy) },
    ),
    0,
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

function assertVersionCmd(pyproject: any, versionCmd?: string | string[]) {
  const dynamic: string[] = pyproject.project?.dynamic ?? [];
  if (dynamic.includes('version') && !versionCmd) {
    throw Error(`'versionCmd' is required when using a dynamic version`);
  }
}

async function verify(pluginConfig: PluginConfig, context: Context) {
  const { logger } = context;
  const {
    srcDir,
    setupPath,
    pypiPublish,
    repoUrl,
    repoUsername,
    repoToken,
    versionCmd,
  } = new DefaultConfig(pluginConfig);

  const execaOptions: Options = pipe(context);

  if (pypiPublish !== false) {
    const repo = process.env['PYPI_REPO_URL'] ?? repoUrl;
    const username = process.env['PYPI_USERNAME'] ?? repoUsername;
    const token = process.env['PYPI_TOKEN'] ?? repoToken;

    if (token === '') {
      throw new Error(
        `Token is not set. Either set PYPI_TOKEN environment variable or repoToken in plugin configuration`,
      );
    }

    logger.log(`Verify authentication for ${username}@${repo}`);
    await verifyAuth(repo, username, token);
  }

  if (isLegacyBuildInterface(srcDir)) {
    logger.log('pyproject.toml not found, using legacy interface (setup.py)');

    if (!fs.existsSync(setupPath)) {
      throw Error(`setup.py not found, path: ${setupPath}`);
    }

    if (!versionCmd) {
      logger.log('Verify that version is not set in setup.py');
      await verifySetupPy(setupPath, execaOptions);
    }
  } else {
    const pyprojectPath = path.join(srcDir, 'pyproject.toml');
    const toml = fs.readFileSync(pyprojectPath, {
      encoding: 'utf8',
      flag: 'r',
    });
    const pyproject = TOML.parse(toml);
    assertVersionCmd(pyproject, versionCmd);
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
