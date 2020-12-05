const {setReleaseVersion, sDistPackage, bDistPackage} = require('../lib/prepare')
const path = require('path')
const fs = require('fs')
const { genPackage } = require('./util')

const version = '1.0.1'
const setupPy = '.tmp/prepare/setup.py'
const distDir = 'dist'
let setupPyDir = path.dirname(setupPy)
let packageName = 'semantic-release-pypi-prepare-test'

beforeAll(async () => {
    await genPackage(setupPy, packageName)
})

afterAll(async () => {
    fs.rmdirSync(setupPyDir, {recursive: true})
})

test('test prepare functions', async() => {
    await expect(setReleaseVersion(setupPy, version)).resolves.toBe(undefined)
    await expect(sDistPackage(setupPy, distDir)).resolves.toBe(undefined)
    await expect(bDistPackage(setupPy, distDir)).resolves.toBe(undefined)
})