const { verifyConditions, prepare, publish } = require('../index')
const { genPluginArgs, hasPackage } = require('./util')
const fs = require('fs-extra')

const packageDir = '.tmp/package'

afterAll(async () => {
    fs.removeSync(packageDir)
})

test('test semantic-release-pypi', async() => {
    if(!process.env['TESTPYPI_TOKEN']) {
        console.warn('skipped test semantic-release-pypi because TESTPYPI_TOKEN is not set')
        return
    }
    process.env['PYPI_TOKEN'] = process.env['TESTPYPI_TOKEN']

    let {config, context, packageName} = await genPluginArgs(packageDir + '/default/setup.py')

    await verifyConditions(config, context)
    await prepare(config, context)
    await publish(config, context)
    
    let res = await hasPackage('https://test.pypi.org', packageName, context.nextRelease.version)
    expect(res).toBe(true)

}, 30000)

test('test semantic-release-pypi with channel', async() => {
    if(!process.env['TESTPYPI_TOKEN']) {
        console.warn('skipped test semantic-release-pypi because TESTPYPI_TOKEN is not set')
        return
    }
    process.env['PYPI_TOKEN'] = process.env['TESTPYPI_TOKEN']
    let {config, context, packageName} = await genPluginArgs(packageDir + '/default/setup.py', 'integration', 'next') // Channel is 'next'

    await verifyConditions(config, context)
    await prepare(config, context)
    await publish(config, context)

    let versionToRelease = `${context.nextRelease.version}+${context.nextRelease.channel}`
    let res = await hasPackage('https://test.pypi.org', packageName, versionToRelease)
    expect(res).toBe(true)

}, 30000)

test('test semantic-release-pypi with pypiPublish unset', async() => {
    let {config, context} = await genPluginArgs(packageDir + '/private/setup.py', 'private')
    config.pypiPublish = false

    await verifyConditions(config, context)
    await prepare(config, context)
    await publish(config, context)
    expect(context.logger.log).toHaveBeenCalledWith('Not publishing package due to requested configuration');

}, 30000)