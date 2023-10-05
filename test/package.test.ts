import fs from 'fs';
import { prepare, publish, verifyConditions } from '../lib/index';
import { genPackage, genPluginArgs, hasPackage } from './util';

const packageDir = '.tmp/package';

afterAll(async () => {
  fs.rmSync(packageDir, { recursive: true, force: true });
});

test('test semantic-release-pypi', async () => {
  if (!process.env['TESTPYPI_TOKEN']) {
    console.warn(
      'skipped test semantic-release-pypi because TESTPYPI_TOKEN is not set',
    );
    return;
  }
  process.env['PYPI_TOKEN'] = process.env['TESTPYPI_TOKEN'];

  const { config, context, packageName } = await genPluginArgs(
    packageDir + '/default/setup.py',
  );
  await genPackage(config.setupPy, packageName);

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
  const { config, context, packageName } = await genPluginArgs(
    packageDir + '/private/setup.py',
    'private',
  );
  await genPackage(config.setupPy, packageName);
  config.pypiPublish = false;

  await verifyConditions(config, context);
  await prepare(config, context);
  await publish(config, context);
  expect(context.logger.log).toHaveBeenCalledWith(
    'Not publishing package due to requested configuration',
  );
}, 30000);
