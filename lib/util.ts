import execa from 'execa';
import path from 'path';

async function normalizeVersion(version: string) {
  const { stdout } = await execa('python3', [
    '-c',
    'import pkg_resources\n' +
      `print(pkg_resources.packaging.version.Version('${version}'))`,
  ]);
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

export { normalizeVersion, setopt };
