const {prepare, setReleaseVersion, sDistPackage, bDistPackage} = require('../lib/prepare')

const version = '1.0.1'
const setupPy = './python_package/setup.py'
const distDir = 'dist'

test('test prepare functions', async() => {
    await expect(setReleaseVersion(setupPy, version)).resolves.toBe(undefined)
    await expect(sDistPackage(setupPy, distDir)).resolves.toBe(undefined)
    await expect(bDistPackage(setupPy, distDir)).resolves.toBe(undefined)
})