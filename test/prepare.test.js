const {setReleaseVersion, sDistPackage, bDistPackage} = require('../lib/prepare')
const path = require('path')
const fs = require('fs-extra')
const { genPackage } = require('./util')

const version = '1.0.1'
const setupPy = '.tmp/prepare/setup.py'
const distDir = 'dist'
let packageName = 'semantic-release-pypi-prepare-test'

beforeAll(async () => {
    await genPackage(setupPy, packageName)
})

afterAll(async () => {
    fs.removeSync(".tmp/prepare")
})

describe('prepare: build functions', () => {
    

    let testCases = [
        {
            name: "setup.py",
            buildFile: '.tmp/prepare/setup-example/setup.py'
        },
        {
            name: "pyproject.toml",
            buildFile: '.tmp/prepare/setup-pyproject/pyproject.toml'
        },
    ]

    for(let t of testCases) {
        test(t.name, async() => {

            let context = {
                stdout: process.stdout,
                stderr: process.stderr,
            }

            let srcDir = path.dirname(t.buildFile); 

            await genPackage(t.buildFile)
            await expect(sDistPackage(srcDir, distDir, context)).resolves.toBe(undefined)
            await expect(bDistPackage(srcDir, distDir, context)).resolves.toBe(undefined)
        }, 15000)
    }
    
    
})

test('prepare: setReleaseVersion', async() => {
    await expect(setReleaseVersion(setupPy, version)).resolves.toBe(undefined)
});