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
