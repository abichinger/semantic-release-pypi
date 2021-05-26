const execa = require('execa')
const { getOption } = require('./util')
const path = require('path')

async function publishPackage(setupPy, distDir, repoUrl){
    try{
        await execa('python', [
            '-m',
            'twine',
            'upload',
            '--repository-url',
            repoUrl,
            '--non-interactive',
            '--skip-existing',
            `${distDir}/*`
        ], {cwd: path.dirname(setupPy), env: {
            TWINE_USERNAME: process.env['PYPI_USERNAME'] ? process.env['PYPI_USERNAME'] : '__token__',
            TWINE_PASSWORD: process.env['PYPI_TOKEN']
        }})
    } catch(err){
        throw err
    }
}

async function publish(pluginConfig, context){
    let setupPy = getOption(pluginConfig, 'setupPy')
    let distDir = getOption(pluginConfig, 'distDir')
    let repoUrl = process.env['PYPI_REPO_URL'] ? process.env['PYPI_REPO_URL'] : getOption(pluginConfig, 'repoUrl')

    await publishPackage(setupPy, distDir, repoUrl)
}

module.exports = {
    publish,
    publishPackage
}