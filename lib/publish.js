const execa = require('execa')
const { getOption } = require('./util')
const path = require('path')

function publishPackage(setupPy, distDir, repoUrl, gpgSign, gpgIdentity){
    return execa('python', [
        '-m',
        'twine',
        'upload',
        '--repository-url',
        repoUrl,
        '--non-interactive',
        '--skip-existing',
        '--verbose',
        gpgSign ? '--sign' : null,
        gpgSign && gpgIdentity ? '--identity' : null,
        gpgSign && gpgIdentity ? gpgIdentity : null,
        `${distDir}/*`
    ].filter(arg => arg !== null), {cwd: path.dirname(setupPy), env: {
        TWINE_USERNAME: process.env['PYPI_USERNAME'] ? process.env['PYPI_USERNAME'] : '__token__',
        TWINE_PASSWORD: process.env['PYPI_TOKEN']
    }})
}

async function publish(pluginConfig, { logger, stdout, stderr }){
    let setupPy = getOption(pluginConfig, 'setupPy')
    let distDir = getOption(pluginConfig, 'distDir')
    let pypiPublish = getOption(pluginConfig, 'pypiPublish')
    let repoUrl = process.env['PYPI_REPO_URL'] ? process.env['PYPI_REPO_URL'] : getOption(pluginConfig, 'repoUrl')
    let gpgSign = getOption(pluginConfig, 'gpgSign')
    let gpgIdentity = getOption(pluginConfig, 'gpgIdentity')

    if (pypiPublish !== false) {
        logger.log(`Publishing package to ${repoUrl}`)
        let result = publishPackage(setupPy, distDir, repoUrl, gpgSign, gpgIdentity)
        result.stdout.pipe(stdout, {end: false})
        result.stderr.pipe(stderr, {end: false})
        await result;
    } else {
        logger.log('Not publishing package due to requested configuration')
    }
}

module.exports = {
    publish,
    publishPackage
}