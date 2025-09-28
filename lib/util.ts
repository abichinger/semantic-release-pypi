import { execa, execaCommand, Options, ResultPromise } from 'execa';
import path from 'path';
import url from 'url';
import { Context } from './@types/semantic-release/index.js';

export const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

async function normalizeVersion(
  version: string,
  options: Options = {},
): Promise<string> {
  const { stdout } = await spawn(
    'python3',
    [
      '-c',
      `from packaging.version import Version\nprint(Version('${version}'))`,
    ],
    options,
  );
  return stdout as unknown as string;
}

function setopt(
  setupPy: string,
  command: string,
  option: string,
  value: string,
) {
  return spawn(
    'python3',
    [
      path.basename(setupPy),
      'setopt',
      `--command=${command}`,
      `--option=${option}`,
      `--set-value=${value}`,
    ],
    { cwd: path.dirname(setupPy) },
  );
}

function pipe(context: Context): Options {
  return {
    stdout: context.stdout as any,
    stderr: context.stderr as any,
  };
}

function spawn(
  file: string | URL,
  args?: readonly string[],
  options?: Options,
): ResultPromise {
  const cp = execa(file, args, {
    ...options,
    stdout: undefined,
    stderr: undefined,
  });

  if (options?.stdout) {
    (cp.stdout as any)?.pipe(options.stdout, { end: false });
  }
  if (options?.stderr) {
    (cp.stderr as any)?.pipe(options.stderr, { end: false });
  }

  return cp;
}

function spawnCommand(command: string, options?: Options): ResultPromise {
  const cp = execaCommand(command, {
    ...options,
    stdout: undefined,
    stderr: undefined,
  });

  if (options?.stdout) {
    (cp.stdout as any)?.pipe(options.stdout, { end: false });
  }
  if (options?.stderr) {
    (cp.stderr as any)?.pipe(options.stderr, { end: false });
  }

  return cp;
}

export { normalizeVersion, pipe, setopt, spawn, spawnCommand };
