import { execa, Options } from 'execa';
import path from 'path';
import { Context } from './@types/semantic-release';

async function normalizeVersion(
  version: string,
  options: Options = {},
): Promise<string> {
  const { stdout } = await execa(
    'python3',
    [
      '-c',
      `from packaging.version import Version\nprint(Version('${version}'))`,
    ],
    options,
  );
  return stdout;
}

function setopt(
  setupPy: string,
  command: string,
  option: string,
  value: string,
) {
  return execa(
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
    stdout: context.stdout,
    stderr: context.stderr,
  };
}

export { normalizeVersion, pipe, setopt };
