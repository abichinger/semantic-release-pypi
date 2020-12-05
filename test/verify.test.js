const {verify, assertEnvVar, assertExitCode, assertPackage, verifyToken, verifySetupPy, verifyAuth} = require('../lib/verify')
const path = require('path')
const fs = require('fs')
const { genPackage } = require('./util')


const setupPy = '.tmp/verify/setup.py'
const setupPyWithVersion = '.tmp/verify2/setup.py'
let packageName = 'semantic-release-pypi-verify-test'

let setupPyContent = `
from setuptools import setup
setup(version='1.0.0', description="test")
`

beforeAll(async () => {
    await genPackage(setupPy, packageName)
    await genPackage(setupPyWithVersion, packageName, setupPyContent)
})

afterAll(async () => {
    fs.rmdirSync(path.dirname(setupPy), {recursive: true})
    fs.rmdirSync(path.dirname(setupPyWithVersion), {recursive: true})
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

test('test verifyToken', async() => {
    expect(verifyToken('pypi-1234567')).toBe(undefined)
    expect(() => verifyToken('1234567')).toThrow()
})

test('test verifySetupPy', async() => {
    await expect(verifySetupPy(setupPy)).resolves.toBe(undefined)
    await expect(verifySetupPy(setupPyWithVersion)).rejects.toThrow()
})

test('test verifyAuth', async() => {
    let repoUrl = 'https://test.pypi.org/legacy/'
    
    await expect(verifyAuth(repoUrl, '12345')).rejects.toThrow()
    if(process.env['TESTPYPI_TOKEN']){
        await expect(verifyAuth(repoUrl, process.env['TESTPYPI_TOKEN'])).resolves.toBe(undefined)
    }
    else {
        console.warn('skipped verifyAuth because TESTPYPI_TOKEN is not set')
    }
})