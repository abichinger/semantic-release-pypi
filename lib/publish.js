const execa = require('execa')
const { getOption } = require('./util')
const path = require('path')

async function publishPackage(setupPy, distDir){
    try{
        await execa('python', [
            '-m',
            'twine',
            'upload',
            '--non-interactive',
            '--skip-existing',
            `${distDir}/*`
        ], {cwd: path.dirname(setupPy), env: {
            TWINE_USERNAME: '__token__',
            TWINE_PASSWORD: process.env['PYPI_TOKEN']
        }})
    } catch(err){
        throw err
    }
}

async function publish(pluginConfig, context){
    let setupPy = getOption(pluginConfig, 'setupPy')
    let distDir = getOption(pluginConfig, 'distDir')

    await publishPackage(setupPy, distDir)
}

module.exports = {
    publish,
    publishPackage
}