const defaultOptions = require('./defaultOptions')
const execa = require('execa')

function getOption(pluginConfig, option){
    return pluginConfig[option] ? pluginConfig[option] : defaultOptions[option]
}

async function normalizeVersion(version){
    const { stdout } = await execa('python', [
        '-c',
        'from setuptools.extern.packaging.version import Version\n' +
        `print(Version('${version}'))`
    ])
    return stdout
}

module.exports = {
    getOption,
    normalizeVersion
}