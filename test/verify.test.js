const {verify, assertEnvVar, assertExitCode, assertPackage, verifySetupPy, verifyAuth} = require('../lib/verify')
const path = require('path')
const fs = require('fs-extra')
const { genPackage } = require('./util')

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

test('test verifySetupPy', async() => {

    let testfn = async (setupPyContent, resolves) => {

        await genPackage(setupPy, packageName, setupPyContent)
        let promise = verifySetupPy(setupPy)

        if(resolves === false){
            return expect(promise).rejects.toThrow()
        }
        else {
            return expect(promise).resolves.toBe(undefined)
        }
    }

    await testfn(`from setuptools import setup\nsetup()`, true)
    await testfn(`from setuptools import setup\nsetup(version='1.0.0', description="test")`, false)
    await testfn(`# under the terms of the GNU General Public License version 3, or`, true)
    await testfn(`from setuptools import setup\nv='1.0.0'\nsetup(version=v, description="test")`, false)
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