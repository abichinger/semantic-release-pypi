const defaultOptions = require('./defaultOptions')
const execa = require('execa')
const path = require('path')

function getOption(pluginConfig, option){
    return pluginConfig[option] ? pluginConfig[option] : defaultOptions[option]
}

async function normalizeVersion(version){
    const { stdout } = await execa('python', [
        '-c',
        'import pkg_resources\n' +
        `print(pkg_resources.packaging.version.Version('${version}'))`
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