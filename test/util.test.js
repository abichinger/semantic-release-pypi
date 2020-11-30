const { getOption } = require('../lib/util')

test('test getOption', async() => {
    expect(getOption({}, 'distDir')).toBe('dist')
    expect(getOption({distDir: 'mydist'}, 'distDir')).toBe('mydist')
    expect(getOption({}, 'foo')).toBe(undefined)
})