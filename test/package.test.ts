import { prepare, publish, verifyConditions } from '../lib/index';
import { genPackage, hasPackage } from './util';

test('test semantic-release-pypi (setup.py)', async () => {
  if (!process.env['TESTPYPI_TOKEN']) {
    console.warn(
      'skipped test semantic-release-pypi because TESTPYPI_TOKEN is not set',
    );
    return;
  }
  process.env['PYPI_TOKEN'] = process.env['TESTPYPI_TOKEN'];

  const { config, context, packageName } = await genPackage({
    legacyInterface: true,
  });

  await verifyConditions(config, context);
  await prepare(config, context);
  await publish(config, context);

  const res = await hasPackage(
    'https://test.pypi.org',
    packageName,
    context.nextRelease.version,
  );
  expect(res).toBe(true);
}, 30000);

test('test semantic-release-pypi (pyproject.toml)', async () => {
  if (!process.env['TESTPYPI_TOKEN']) {
    console.warn(
      'skipped test semantic-release-pypi because TESTPYPI_TOKEN is not set',
    );
    return;
  }
  process.env['PYPI_TOKEN'] = process.env['TESTPYPI_TOKEN'];

  const { config, context, packageName } = await genPackage({
    legacyInterface: false,
  });

  await verifyConditions(config, context);
  await prepare(config, context);
  await publish(config, context);

  const res = await hasPackage(
    'https://test.pypi.org',
    packageName,
    context.nextRelease.version,
  );
  expect(res).toBe(true);
}, 30000);

test('test semantic-release-pypi with pypiPublish unset', async () => {
  const { config, context } = await genPackage({
    legacyInterface: true,
    config: { pypiPublish: false },
  });

  await verifyConditions(config, context);
  await prepare(config, context);
  await publish(config, context);
  expect(context.logger.log).toHaveBeenCalledWith(
    'Not publishing package due to requested configuration',
  );
}, 30000);

test('semantic-release-pypi (poetry)', async () => {
  const pyproject = `[tool.poetry]
name = "poetry-demo"
version = "0.1.0"
description = ""
authors = ["John Doe <john.doe@example.com>"]
packages = [{include = "poetry_demo"}]

[tool.poetry.dependencies]
python = "^3.7"


[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"`;

  const { config, context } = await genPackage({
    legacyInterface: false,
    config: { pypiPublish: false },
    content: pyproject,
    files: {
      poetry_demo: {
        '__init__.py': '',
      },
    },
  });

  let built = false;
  context.stdout.on('data', (bytes) => {
    const str = bytes.toString('utf-8');
    if (
      str.includes('Successfully built') &&
      str.includes('poetry_demo-1.0.0')
    ) {
      built = true;
    }
  });

  await verifyConditions(config, context);
  await prepare(config, context);
  await publish(config, context);

  expect(built).toEqual(true);
}, 30000);
