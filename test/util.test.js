const { getOption, normalizeVersion } = require('../lib/util')

test('test getOption', async() => {
    expect(getOption({}, 'distDir')).toBe('dist')
    expect(getOption({}, 'setupPy')).toBe('./setup.py')
    expect(getOption({}, 'repoUrl')).toBe('https://upload.pypi.org/legacy/')

    expect(getOption({distDir: 'mydist'}, 'distDir')).toBe('mydist')
    expect(getOption({}, 'foo')).toBe(undefined)
})

test('test normalizeVersion', async() => {
    await expect(normalizeVersion('1.0.1')).resolves.toBe('1.0.1')
    
    await expect(normalizeVersion('1.0.1a')).resolves.toBe('1.0.1a0')
    await expect(normalizeVersion('1.0.1alpha')).resolves.toBe('1.0.1a0')
    await expect(normalizeVersion('1.0.1-a')).resolves.toBe('1.0.1a0')
    await expect(normalizeVersion('1.0.1-a1')).resolves.toBe('1.0.1a1')
    await expect(normalizeVersion('1.0.1-alpha')).resolves.toBe('1.0.1a0')
    await expect(normalizeVersion('1.0.1-alpha1')).resolves.toBe('1.0.1a1')

    await expect(normalizeVersion('1.0.1-b')).resolves.toBe('1.0.1b0')
    await expect(normalizeVersion('1.0.1-beta')).resolves.toBe('1.0.1b0')
    await expect(normalizeVersion('1.0.1-rc')).resolves.toBe('1.0.1rc0')
    await expect(normalizeVersion('1.0.1-pre')).resolves.toBe('1.0.1rc0')
    await expect(normalizeVersion('1.0.1-post')).resolves.toBe('1.0.1.post0')
    await expect(normalizeVersion('1.0.1-dev')).resolves.toBe('1.0.1.dev0')

    await expect(normalizeVersion('1.0.1-next')).rejects.toThrow()
    await expect(normalizeVersion('1.0.1-develop')).rejects.toThrow()

    await expect(normalizeVersion('1.0.1', 'next')).resolves.toBe('1.0.1+next')
    await expect(normalizeVersion('1.0.1', 'develop')).resolves.toBe('1.0.1+develop')
    await expect(normalizeVersion('1.0.1', 'develop_new')).resolves.toBe('1.0.1+develop.new')
    await expect(normalizeVersion('1.0.1', 'develop-new')).resolves.toBe('1.0.1+develop.new')

    await expect(normalizeVersion('1 2 3')).rejects.toThrow()
})