const defaultOptions = require('./defaultOptions')
const execa = require('execa')
const path = require('path')

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

function setopt(setupPy, command, option, value){
    return execa('python', [
        path.basename(setupPy),
        'setopt',
        `--command=${command}`,
        `--option=${option}`,
        `--set-value=${value}`
    ], {cwd: path.dirname(setupPy)})
}

module.exports = {
    getOption,
    normalizeVersion,
    setopt
}