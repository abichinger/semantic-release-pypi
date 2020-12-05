const {verify, assertEnvVar, assertExitCode, assertPackage, verifyToken, verifySetupPy, verifyAuth} = require('../lib/verify')

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
    await expect(verifySetupPy('./python_package/setup.py')).resolves.toBe(undefined)
    await expect(verifySetupPy('./python_package/setup_with_version.py')).rejects.toThrow()
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