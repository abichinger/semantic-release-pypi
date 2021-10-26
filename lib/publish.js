const execa = require('execa')
const { getOption } = require('./util')
const path = require('path')

function publishPackage(setupPy, distDir, repoUrl){
    return execa('python', [
        '-m',
        'twine',
        'upload',
        '--repository-url',
        repoUrl,
        '--non-interactive',
        '--skip-existing',
        '--verbose',
        `${distDir}/*`
    ], {cwd: path.dirname(setupPy), env: {
        TWINE_USERNAME: process.env['PYPI_USERNAME'] ? process.env['PYPI_USERNAME'] : '__token__',
        TWINE_PASSWORD: process.env['PYPI_TOKEN']
    }})
}

async function publish(pluginConfig, { logger, stdout, stderr }){
    let setupPy = getOption(pluginConfig, 'setupPy')
    let distDir = getOption(pluginConfig, 'distDir')
    let pypiPublish = getOption(pluginConfig, 'pypiPublish')
    let repoUrl = process.env['PYPI_REPO_URL'] ? process.env['PYPI_REPO_URL'] : getOption(pluginConfig, 'repoUrl')

    if (pypiPublish !== false) {
        logger.log(`Publishing package to ${repoUrl}`)
        let result = publishPackage(setupPy, distDir, repoUrl)
        result.stdout.pipe(stdout, {end: false})
        result.stderr.pipe(stderr, {end: false})
        await result;
    } else {
        logger.log('Not publishing package due to requested configration')
    }
}

module.exports = {
    publish,
    publishPackage
}