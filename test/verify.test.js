const {assertEnvVar, assertExitCode, assertPackage, verifySetupPy, verifyAuth, verify} = require('../lib/verify')
const path = require('path')
const fs = require('fs-extra')
const { genPackage, genPluginArgs } = require('./util')

const setupPy = '.tmp/verify/setup.py'
let packageName = 'semantic-release-pypi-verify-test'

afterAll(async () => {
    fs.removeSync(path.dirname(setupPy))
})

test('test assertEnvVar', async() => {
    expect(assertEnvVar('PATH')).toBe(undefined)
    expect(() => assertEnvVar('FOO_BAZ_BAR')).toThrow()
})

test('test assertExitCode', async() => {
    await expect(assertExitCode('node', ['--version'], 0)).resolves.toBe(undefined)
    await expect(assertExitCode('node', ['--version'], 1)).rejects.toThrow()

    await expect(assertExitCode('node', ['--ver'], 9)).resolves.toBe(undefined)
    await expect(assertExitCode('node', ['--ver'], 0)).rejects.toThrow()
})

test('test assertPackage', async() => {
    await expect(assertPackage('pip')).resolves.toBe(undefined)
    await expect(assertPackage('foo-bar-baz')).rejects.toThrow()
})

describe('test verifySetupPy', () => {

    let testCases = [
        {
            content: `from setuptools import setup\nsetup()`,
            resolves: true,
        },
        {
            content: `from setuptools import setup\nsetup(version='1.0.0', description="test")`,
            resolves: false,
        },
        {
            content: `# under the terms of the GNU General Public License version 3, or`,
            resolves: true,
        },
        {
            content: `from setuptools import setup\nv='1.0.0'\nsetup(version=v, description="test")`,
            resolves: false,
        },
    ]

    let testfn = async (setupPyContent, resolves) => {

        await genPackage(setupPy, packageName, setupPyContent)
        let promise = verifySetupPy(setupPy)

        if(resolves === false){
            return expect(promise).rejects.toThrow("version in")
        }
        else {
            return expect(promise).resolves.toBe(undefined)
        }
    }

    for(let c of testCases) {
        test(c.content, async() => {
            await testfn(c.content, c.resolves)
        })
    }
})

test('test verifyAuth', async() => {
    let repoUrl = 'https://test.pypi.org/legacy/'
    
    await expect(verifyAuth(repoUrl, '__token__', '12345')).rejects.toThrow()
    if(process.env['TESTPYPI_TOKEN']){
        await expect(verifyAuth(repoUrl, '__token__', process.env['TESTPYPI_TOKEN'])).resolves.toBe(undefined)
    }
    else {
        console.warn('skipped verifyAuth because TESTPYPI_TOKEN is not set')
    }
})

test('test without setup.py', async() => {
    let {config, context} = await genPluginArgs('./does-not-exist/setup.py', 'unknown')
    config.pypiPublish = false

    let promise = verify(config, context)
    return expect(promise).rejects.toThrow('setup.py not found')
})