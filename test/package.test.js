const { verifyConditions, prepare, publish } = require('../index')
const { genPackage } = require('./util')
const fs = require('fs-extra')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

let setupPy = '.tmp/package/setup.py'
let setupPyDir = path.dirname(setupPy)

let packageName = 'semantic-release-pypi-integration-test-'+uuidv4()

let pluginConfig = {
    setupPy: setupPy,
    repoUrl: 'https://test.pypi.org/legacy/'
}

let context = {
    nextRelease: {
        version: '1.2.3'
    }
}

beforeAll(async () => {
    await genPackage(setupPy, packageName)
})

afterAll(async () => {
    fs.removeSync(setupPyDir)
})

test('test semantic-release-pypi', async() => {
    if(!process.env['TESTPYPI_TOKEN']) {
        console.warn('skipped test semantic-release-pypi because TESTPYPI_TOKEN is not set')
        return
    }
    process.env['PYPI_TOKEN'] = process.env['TESTPYPI_TOKEN']

    await verifyConditions(pluginConfig, context)
    await prepare(pluginConfig, context)
    await publish(pluginConfig, context)

    console.log(`package successfully published: https://test.pypi.org/project/${packageName}`)

}, 30000)